---
name: deploy-infitek
description: >
  Full automated deployment pipeline for the infitek_erp project to Alibaba Cloud ACK.
  Handles everything: version bump → Kaniko image build (api + web) → ACR push →
  rolling update → health verification. Use this skill whenever the user says "重新部署",
  "打包镜像", "deploy", "发布新版本", "rebuild and deploy", "build and push image",
  "部署 infitek", or anything about deploying infitek_erp to Kubernetes.
  Trigger proactively whenever infitek_erp has been updated and needs to be redeployed.
---

# Deploy Skill — infitek_erp

End-to-end deployment pipeline for the infitek_erp monorepo on Alibaba Cloud ACK.
Uses Kaniko for in-cluster image builds (no local Docker daemon required).

## Project Configuration (read dynamically from `deploy/k8s/secret.yaml`)

Do not hardcode real addresses in this skill.
Put deployment config into `deploy/k8s/secret.yaml` under `stringData` and read it at runtime.

Required keys in `deploy/k8s/secret.yaml`:

```yaml
stringData:
  DEPLOY_REGISTRY: "<your-registry>"
  DEPLOY_ACR_NS: "<your-acr-namespace>"
  DEPLOY_APP_NAME: "infitek_erp"
  DEPLOY_K8S_NS: "test"
  DEPLOY_ACR_SECRET: "<your-image-pull-secret>"
  DEPLOY_KANIKO_IMAGE: "<your-kaniko-image>"
  DEPLOY_BUSYBOX_IMAGE: "<your-busybox-image>"
  DEPLOY_STORAGE_CLASS: "alicloud-disk-topology-alltype"
  DEPLOY_PVC_NAME: "${PVC_NAME}"
  DEPLOY_UPLOADER_POD: "${UPLOADER_POD}"
```

Runtime loader snippet (use before each step group):

```bash
export PATH="$HOME/bin:$PATH"
PROJECT_ROOT=$(find /home/node/a0/workspace -maxdepth 3 -name "infitek_erp" -type d | head -1)
SECRET_FILE="$PROJECT_ROOT/deploy/k8s/secret.yaml"

read_secret() {
  local key="$1"
  grep -E "^[[:space:]]+${key}:" "$SECRET_FILE" | head -1 | sed -E 's/^[^:]+:[[:space:]]*"?([^"#]+)"?$/\1/'
}

REGISTRY=$(read_secret DEPLOY_REGISTRY)
ACR_NS=$(read_secret DEPLOY_ACR_NS)
APP_NAME=$(read_secret DEPLOY_APP_NAME)
K8S_NS=$(read_secret DEPLOY_K8S_NS)
ACR_SECRET=$(read_secret DEPLOY_ACR_SECRET)
KANIKO_IMAGE=$(read_secret DEPLOY_KANIKO_IMAGE)
BUSYBOX_IMAGE=$(read_secret DEPLOY_BUSYBOX_IMAGE)
STORAGE_CLASS=$(read_secret DEPLOY_STORAGE_CLASS)
PVC_NAME=$(read_secret DEPLOY_PVC_NAME)
UPLOADER_POD=$(read_secret DEPLOY_UPLOADER_POD)
```

> The project root is the `infitek_erp/` directory inside the current workspace.
> Locate it dynamically:
> ```bash
> PROJECT_ROOT=$(find /home/node/a0/workspace -maxdepth 3 -name "infitek_erp" -type d | head -1)
> ```

## Architecture Notes

- **Monorepo**: Both `apps/api` and `apps/web` Dockerfiles use the monorepo root as build context.
- **Single PVC**: One shared PVC holds the full source. Kaniko jobs run **sequentially** (PVC is ReadWriteOnce).
- **nginx proxy**: The web container's nginx proxies `/api/*` → `http://infitek-service:3000/api/`.

---

## Full Deployment Workflow

Execute steps in order. Print the step name as you start each one.

---

### STEP 1 — Detect Current Version & Compute Next Version

```bash
export PATH="$HOME/bin:$PATH"

CURRENT=$(kubectl get deployment infitek-api -n "$K8S_NS" \
  -o jsonpath='{.spec.template.spec.containers[0].image}' 2>/dev/null)
echo "Current image: $CURRENT"

CURRENT_VER=$(echo "$CURRENT" | grep -oP 'v\d+\.\d+\.\d+' | head -1)
echo "Current version: $CURRENT_VER"
```

Increment the **minor** version: `v1.0.0 → v1.1.0`. If no version found, start at `v1.0.0`.

Export `NEW_VER` (e.g. `v1.1.0`) for all subsequent steps.

---

### STEP 2 — Prepare PVC & Uploader Pod

Clean up any leftover resources first:

```bash
export PATH="$HOME/bin:$PATH"
kubectl delete pod ${UPLOADER_POD} -n "$K8S_NS" --ignore-not-found
kubectl wait --for=delete pod/${UPLOADER_POD} -n "$K8S_NS" --timeout=60s 2>/dev/null || true
kubectl delete pvc ${PVC_NAME} -n "$K8S_NS" --ignore-not-found
# Wait for PVC deletion
sleep 5
```

Apply PVC:
```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: ${PVC_NAME}
  namespace: test
spec:
  storageClassName: alicloud-disk-topology-alltype
  accessModes: [ReadWriteOnce]
  resources:
    requests:
      storage: 20Gi
```

Apply uploader pod:
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: ${UPLOADER_POD}
  namespace: test
spec:
  restartPolicy: Never
  containers:
    - name: uploader
      image: ${BUSYBOX_IMAGE}
      command: ["sh", "-c", "mkdir -p /workspace && sleep 3600"]
      volumeMounts:
        - name: ctx
          mountPath: /workspace
  volumes:
    - name: ctx
      persistentVolumeClaim:
        claimName: ${PVC_NAME}
```

Wait for uploader to be Running (PVC binds only after pod is scheduled):
```bash
export PATH="$HOME/bin:$PATH"
kubectl wait --for=condition=Ready pod/${UPLOADER_POD} -n "$K8S_NS" --timeout=120s
```

---

### STEP 3 — Package & Upload Monorepo Source

```bash
export PATH="$HOME/bin:$PATH"
PROJECT_ROOT=$(find /home/node/a0/workspace -maxdepth 3 -name "infitek_erp" -type d | head -1)
echo "Project root: $PROJECT_ROOT"

# Package full monorepo (both Dockerfiles need root context)
tar -czf /tmp/infitek-src.tar.gz \
  --exclude=node_modules \
  --exclude=.git \
  --exclude='*/.git' \
  --exclude='*/node_modules' \
  --exclude='apps/web/dist' \
  --exclude='apps/api/dist' \
  -C "$PROJECT_ROOT" .
```

Upload and extract in pod:
```bash
export PATH="$HOME/bin:$PATH"
kubectl cp /tmp/infitek-src.tar.gz ${K8S_NS}/${UPLOADER_POD}:/workspace/src.tar.gz
kubectl exec -n "$K8S_NS" ${UPLOADER_POD} -- sh -c \
  "cd /workspace && tar -xzf src.tar.gz && rm src.tar.gz"
```

Verify:
```bash
kubectl exec -n "$K8S_NS" ${UPLOADER_POD} -- ls /workspace/apps/
kubectl exec -n "$K8S_NS" ${UPLOADER_POD} -- ls /workspace/apps/api/
kubectl exec -n "$K8S_NS" ${UPLOADER_POD} -- ls /workspace/apps/web/
```

---

### STEP 4 — Release PVC (Delete Uploader Pod)

Kaniko cannot attach the PVC while the uploader pod holds it.

```bash
export PATH="$HOME/bin:$PATH"
kubectl delete pod ${UPLOADER_POD} -n "$K8S_NS" --ignore-not-found
kubectl wait --for=delete pod/${UPLOADER_POD} -n "$K8S_NS" --timeout=60s 2>/dev/null || true
```

---

### STEP 5 — Kaniko Build: API Image

See `references/kaniko-jobs.md` for full Job YAML. Key parameters:
- `--context=dir:///workspace`
- `--dockerfile=/workspace/apps/api/Dockerfile`
- `--destination=${REGISTRY}/infitek/infitek_erp:api-${NEW_VER}`

Apply the job, then wait:
```bash
export PATH="$HOME/bin:$PATH"
kubectl apply -f /tmp/kaniko-api-job.yaml
kubectl wait --for=condition=complete job/kaniko-build-api -n "$K8S_NS" --timeout=600s
```

Check logs on failure:
```bash
kubectl logs -n "$K8S_NS" -l job-name=kaniko-build-api --tail=30
```

Delete job after completion:
```bash
kubectl delete job kaniko-build-api -n "$K8S_NS"
```

---

### STEP 6 — Kaniko Build: Web Image

Same flow, different Dockerfile and destination.

See `references/kaniko-jobs.md`. Key parameters:
- `--context=dir:///workspace`
- `--dockerfile=/workspace/apps/web/Dockerfile`
- `--destination=${REGISTRY}/infitek/infitek_erp:web-${NEW_VER}`

Job name: `kaniko-build-web`

Apply, wait, check logs on failure, then delete job.

---

### STEP 7 — Cleanup PVC

```bash
export PATH="$HOME/bin:$PATH"
kubectl delete pvc ${PVC_NAME} -n "$K8S_NS" --ignore-not-found
```

---

### STEP 8 — Apply K8s Manifests (First Deploy Only)

If this is the **first deployment** (deployments don't exist yet), apply base manifests:

```bash
export PATH="$HOME/bin:$PATH"
PROJECT_ROOT=$(find /home/node/a0/workspace -maxdepth 3 -name "infitek_erp" -type d | head -1)

kubectl apply -f "$PROJECT_ROOT/deploy/k8s/configmap.yaml"
kubectl apply -f "$PROJECT_ROOT/deploy/k8s/secret.yaml"
kubectl apply -f "$PROJECT_ROOT/deploy/k8s/api-deployment.yaml"
kubectl apply -f "$PROJECT_ROOT/deploy/k8s/web-deployment.yaml"
kubectl apply -f "$PROJECT_ROOT/deploy/k8s/ingress.yaml"
```

For subsequent deploys, skip this step and go directly to Step 9.

---

### STEP 9 — Rolling Update

```bash
export PATH="$HOME/bin:$PATH"
PROJECT_ROOT=$(find /home/node/a0/workspace -maxdepth 3 -name "infitek_erp" -type d | head -1)
SECRET_FILE="$PROJECT_ROOT/deploy/k8s/secret.yaml"

read_secret() {
  local key="$1"
  grep -E "^[[:space:]]+${key}:" "$SECRET_FILE" | head -1 | sed -E 's/^[^:]+:[[:space:]]*"?([^"#]+)"?$/\1/'
}

REGISTRY=$(read_secret DEPLOY_REGISTRY)
APP_NAME=$(read_secret DEPLOY_APP_NAME)
K8S_NS=$(read_secret DEPLOY_K8S_NS)

kubectl set image deployment/infitek-api \
  api=${REGISTRY}/infitek/${APP_NAME}:api-${NEW_VER} \
  -n "$K8S_NS"

kubectl set image deployment/infitek-web \
  web=${REGISTRY}/infitek/${APP_NAME}:web-${NEW_VER} \
  -n "$K8S_NS"
```

---

### STEP 10 — Verify Rollout

```bash
export PATH="$HOME/bin:$PATH"

kubectl rollout status deployment/infitek-api  -n "$K8S_NS" --timeout=120s
kubectl rollout status deployment/infitek-web  -n "$K8S_NS" --timeout=120s

echo "=== Final Pod Status ==="
kubectl get pods -n "$K8S_NS" -l 'app in (infitek-api,infitek-web)'
```

If rollout fails, immediately rollback:
```bash
kubectl rollout undo deployment/infitek-api  -n "$K8S_NS"
kubectl rollout undo deployment/infitek-web  -n "$K8S_NS"
kubectl describe pod -n "$K8S_NS" -l app=infitek-api | tail -20
```

---

## Error Recovery Cheatsheet

| Error | Fix |
|-------|-----|
| `Multi-Attach error` | Delete uploader pod first, wait for detach |
| `ImagePullBackOff` on Kaniko | Verify kaniko image exists in `hq-docker-mirror` ns |
| `PVC stuck Pending` | Check node zone; use `alicloud-disk-topology-alltype` |
| `Kaniko Job timeout` | Check build logs; re-upload source and retry from Step 3 |
| `CrashLoopBackOff` after deploy | Check app logs; rollback with `kubectl rollout undo` |
| `502 Bad Gateway` on /api/ | Verify `infitek-service` ClusterIP resolves from web pod |

## Reference Files

- `references/kaniko-jobs.md` — Complete Kaniko Job YAML templates for api and web
