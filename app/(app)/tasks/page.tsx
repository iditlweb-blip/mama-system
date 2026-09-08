import { redirect } from 'next/navigation'

// /tasks was folded into the "ניהול" page's own "משימות" tab (see
// app/(app)/business/BusinessClient.tsx) - keep this route alive as a
// redirect so old links (bookmarks, push-notification deep links) still land
// somewhere useful instead of 404ing.
export default function TasksPage() {
  redirect('/business')
}
