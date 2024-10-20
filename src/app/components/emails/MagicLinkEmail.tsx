// emails/MagicLinkEmail.tsx
import React from 'react';

export const MagicLinkEmail = ({ url }: { url: string }) => (
  <div>
    <h1>Welcome to Our Course Platform</h1>
    <p>Click the link below to access your course:</p>
    <a href={url}>Access Course</a>
  </div>
);
