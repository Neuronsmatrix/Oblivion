import { Link } from 'react-router-dom';
import { Button } from '../components/ui';

export function NotFoundPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--paper)', padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 420 }}>
        <div className="mono" style={{ color: 'var(--ink-3)', marginBottom: 12 }}>404</div>
        <h1 style={{ fontSize: 'var(--fs-36)', marginBottom: 12 }}>Page not found</h1>
        <p style={{ color: 'var(--ink-2)', marginBottom: 24 }}>The page you were looking for doesn't exist or has moved.</p>
        <Link to="/"><Button>Back to home</Button></Link>
      </div>
    </div>
  );
}
