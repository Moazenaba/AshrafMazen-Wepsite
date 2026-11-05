// The number of visitor requests waiting, and a way to refresh the requests tab after one is handled elsewhere.
import { useCallback, useEffect, useState } from 'react';
import { getPendingSubmissionsCount } from '../../../../services/dataService';

export function useSubmissionsBadge() {
  const [pending, setPending] = useState<number | null>(null);
  const [listVersion, setListVersion] = useState(0);

  const refresh = useCallback(() => {
    getPendingSubmissionsCount().then(setPending).catch(() => {});
  }, []);
  useEffect(() => {
    refresh();
  }, [refresh]);

  // A request was accepted from outside the requests tab (the lesson form): reload its list and the count
  const markHandled = () => {
    setListVersion((v) => v + 1);
    refresh();
  };

  return { pending, setPending, listVersion, markHandled };
}
