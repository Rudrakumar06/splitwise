export function Loading({ label = 'Loading...' }) { return <p className="loading">{label}</p>; }
export function Alert({ type = 'error', children }) { return children ? <div className={`alert ${type}`}>{children}</div> : null; }
export function Empty({ children }) { return <div className="empty">{children}</div>; }
