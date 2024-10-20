import { NextResponse } from 'next/server';

export async function GET() {
  const response = NextResponse.redirect(`${process.env.NEXT_PUBLIC_DOMAIN}`);

  response.cookies.delete('session');

  return response;
}
