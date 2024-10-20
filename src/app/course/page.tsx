// app/course/page.tsx
import { cookies } from 'next/headers';

import jwt from 'jsonwebtoken';
import { redirect } from 'next/navigation';

export default async function CoursePage() {
  const cookieStore = cookies();
  const token = cookieStore.get('session')?.value;

  if (!token) {
    redirect('/login');
    return null;
  }

  let userEmail = null;

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
    redirect('/login');
    return null;
  }

  return (
    <div>
      <h1>Your Course</h1>
      {userEmail ? (
        <>
          <p>Welcome, {userEmail}!</p>
          <p>Here is your course content...</p>
          <a href="/logout">Logout</a>
        </>
      ) : (
        <>
          <p>You are not logged in.</p>
          <a href="/login">Login</a>
        </>
      )}
    </div>
  );
}
