import Link from 'next/link';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import LogoutButton from './components/emails/ui/LogoutButton';

export default async function HomePage() {
  const cookieStore = cookies();
  const token = cookieStore.get('session')?.value;

  let userEmail = null;

  if (token) {
    try {
      // Verify the JWT
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
        userId: string;
        email: string;
      };
      userEmail = decoded.email;

      // You can also use decoded.userId if needed
    } catch (err) {
      // Invalid token, redirect to login
      console.error('Invalid token:', err);
    }
  }

  return (
    <div>
      <h1>Welcome to the Course Platform</h1>
      <Link className="bg-blue-300 rounded-xl p-2" href={'/course'}>
        Go to course
      </Link>
      {!userEmail ? (
        <>
          <p>You are not logged in.</p>
          <Link href="/login">Login</Link>
          {' | '}
          <Link href="/enroll">Enroll</Link>
        </>
      ) : (
        <>
          <p>Welcome back, {userEmail}!</p>
          <Link href="/course">Go to Course</Link>
          {' | '}
          <LogoutButton />
        </>
      )}
    </div>
  );
}
