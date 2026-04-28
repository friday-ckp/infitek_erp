# Kaniko Job YAML Templates — infitek_erp

Both jobs use the **same PVC** and **full monorepo root** as build context.
Run sequentially: delete first job before applying second.

Replace `${NEW_VER}` with the actual version (e.g., `v1.1.0`).

---

## API Build Job

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: kaniko-build-api
  namespace: test
spec:
  backoffLimit: 0
  template:
    spec:
      restartPolicy: Never
      imagePullSecrets:
        - name: acr-registry-secret-hq
      containers:
        - name: kaniko
          image: crpi-dgkl9khr1943eg60.cn-hangzhou.personal.cr.aliyuncs.com/hq-docker-mirror/kaniko-executor:v1.23.2
          args:
            - "--context=dir:///workspace"
            - "--dockerfile=/workspace/apps/api/Dockerfile"
            - "--destination=crpi-dgkl9khr1943eg60.cn-hangzhou.personal.cr.aliyuncs.com/hq-service/infitek_erp:api-${NEW_VER}"
            - "--cache=false"
            - "--compressed-caching=false"
            - "--snapshot-mode=redo"
          volumeMounts:
            - name: ctx
              mountPath: /workspace
            - name: docker-config
              mountPath: /kaniko/.docker
      volumes:
        - name: ctx
          persistentVolumeClaim:
            claimName: infitek-build-ctx
        - name: docker-config
          secret:
            secretName: acr-registry-secret-hq
            items:
              - key: .dockerconfigjson
                path: config.json
```

---

## Web Build Job

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: kaniko-build-web
  namespace: test
spec:
  backoffLimit: 0
  template:
    spec:
      restartPolicy: Never
      imagePullSecrets:
        - name: acr-registry-secret-hq
      containers:
        - name: kaniko
          image: crpi-dgkl9khr1943eg60.cn-hangzhou.personal.cr.aliyuncs.com/hq-docker-mirror/kaniko-executor:v1.23.2
          args:
            - "--context=dir:///workspace"
            - "--dockerfile=/workspace/apps/web/Dockerfile"
            - "--destination=crpi-dgkl9khr1943eg60.cn-hangzhou.personal.cr.aliyuncs.com/hq-service/infitek_erp:web-${NEW_VER}"
            - "--cache=false"
            - "--compressed-caching=false"
            - "--snapshot-mode=redo"
          volumeMounts:
            - name: ctx
              mountPath: /workspace
            - name: docker-config
              mountPath: /kaniko/.docker
      volumes:
        - name: ctx
          persistentVolumeClaim:
            claimName: infitek-build-ctx
        - name: docker-config
          secret:
            secretName: acr-registry-secret-hq
            items:
              - key: .dockerconfigjson
                path: config.json
```

---

## Apply & Wait Commands

```bash
export PATH="$HOME/bin:$PATH"

# --- API ---
kubectl apply -f /tmp/kaniko-api-job.yaml
kubectl wait --for=condition=complete job/kaniko-build-api -n test --timeout=600s
kubectl logs -n test -l job-name=kaniko-build-api --tail=20
kubectl delete job kaniko-build-api -n test

# --- Web ---
kubectl apply -f /tmp/kaniko-web-job.yaml
kubectl wait --for=condition=complete job/kaniko-build-web -n test --timeout=600s
kubectl logs -n test -l job-name=kaniko-build-web --tail=20
kubectl delete job kaniko-build-web -n test
```
