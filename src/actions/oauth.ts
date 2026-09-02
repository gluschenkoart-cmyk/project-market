"use server";

import { signIn } from "@/auth";

export async function signInWithGoogle() {
  await signIn("google", { redirectTo: "/profile" });
}

export async function signInWithApple() {
  await signIn("apple", { redirectTo: "/profile" });
}
