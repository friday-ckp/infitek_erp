import { Link } from 'react-router-dom';

export function SourceDocumentLink({
  sourceDocumentType,
  sourceDocumentId,
  sourceDocumentCode,
  sourceDocumentLabel,
  sourceDocumentPath,
}: {
  sourceDocumentType: string;
  sourceDocumentId: number | string | null;
  sourceDocumentCode?: string | null;
  sourceDocumentLabel?: string | null;
  sourceDocumentPath?: string | null;
}) {
  const label = sourceDocumentLabel ?? sourceDocumentType;
  const code = sourceDocumentCode ?? (sourceDocumentId ? `#${sourceDocumentId}` : '-');
  const text = `${label} ${code}`;
  if (sourceDocumentPath) {
    return <Link className="inventory-source-link" to={sourceDocumentPath}>{text}</Link>;
  }
  return <span className="inventory-source-text">{text}</span>;
}
