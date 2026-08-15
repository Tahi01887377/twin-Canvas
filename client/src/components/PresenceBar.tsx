import { useUserStore } from '@/store/userStore';

export function PresenceBar() {
  const { users, currentUser } = useUserStore();
  const otherUsers = users.filter((u) => u.id !== currentUser?.id);

  if (users.length === 0) return null;

  return (
    <div className="flex items-center gap-2 border-t px-3 py-1.5 text-xs">
      {otherUsers.map((user) => (
        <div key={user.id} className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: user.color }} />
          <span className="text-muted-foreground">{user.name}</span>
        </div>
      ))}
      {currentUser && (
        <div className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: currentUser.color }} />
          <span className="font-medium">{currentUser.name} (you)</span>
        </div>
      )}
    </div>
  );
}
