import { redirect } from 'next/navigation';

export default function Home() {
  // TODO: Check authentication status and redirect accordingly
  redirect('/login');
}
