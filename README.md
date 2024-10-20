# Authentication process via magic links

This is a authentication starter/example. Use case will be online courses where users don't need to bother with passwords.

## The tools for the implementation

- NextJs App router
- API routes instead of server actions
- Supabase
- Resend and react-email
- Stripe via webhooks

The issues I had in the past was due setting the cookie right and redirecting correctly after clcicking the magic link. Here is the other github repo I worked on before starting from scratch again. I experimented with server actions and the supabase ssr function.

[The old Github repo with open issues!](https://github.com/Hakan2211/next-auth-magicLink/issues)
