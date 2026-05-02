import { redirect } from 'next/navigation';

export default function RegisterBusinessRedirect() {
  redirect('/register?type=business');
}
