import { useEffect, useState } from "react";

export function useAuth() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let id = localStorage.getItem("der_user_id");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("der_user_id", id);
    }
    setUserId(id);
  }, []);

  return userId;
}
