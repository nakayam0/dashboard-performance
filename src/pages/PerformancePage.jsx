import { useSearchParams, useNavigate } from 'react-router-dom';
import UserPerformance from '../components/UserPerformance';

export default function PerformancePage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const userId = params.get('userId');

  return (
    <div>
      <div style={{ padding: 24, borderBottom: '1px solid #eee' }}>
      </div>

      <UserPerformance userId={userId} />
    </div>
  );
}
