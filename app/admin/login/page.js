"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  getSupabaseBrowser,
} from "../supabaseClient";

import styles from "../admin.module.css";


export default function AdminLoginPage() {
  const router =
    useRouter();

  const [
    email,
    setEmail,
  ] = useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    checking,
    setChecking,
  ] = useState(true);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");


  /* ========================================
     이미 로그인되어 있으면
     바로 admin으로 이동
  ======================================== */

  useEffect(() => {
    let active = true;

    async function checkSession() {
      try {
        const supabase =
          getSupabaseBrowser();

        const {
          data: {
            session,
          },
        } =
          await supabase.auth.getSession();

        if (
          !session ||
          !active
        ) {
          setChecking(false);
          return;
        }

        const response =
          await fetch(
            "/api/admin/me",
            {
              headers: {
                Authorization:
                  `Bearer ${session.access_token}`,
              },
              cache:
                "no-store",
            }
          );

        if (
          response.ok &&
          active
        ) {
          router.replace(
            "/admin"
          );

          return;
        }

        await supabase.auth.signOut();

        if (active) {
          setChecking(false);
        }
      } catch {
        if (active) {
          setChecking(false);
        }
      }
    }

    checkSession();

    return () => {
      active = false;
    };
  }, [router]);


  /* ========================================
     로그인
  ======================================== */

  async function handleLogin(
    event
  ) {
    event.preventDefault();

    setErrorMessage("");

    if (
      !email.trim() ||
      !password
    ) {
      setErrorMessage(
        "이메일과 비밀번호를 입력해주세요."
      );

      return;
    }

    try {
      setLoading(true);

      const supabase =
        getSupabaseBrowser();

      const {
        data,
        error,
      } =
        await supabase.auth.signInWithPassword(
          {
            email:
              email.trim(),

            password,
          }
        );

      if (
        error ||
        !data.session
      ) {
        throw new Error(
          "이메일 또는 비밀번호를 확인해주세요."
        );
      }

      /*
        로그인 성공만으로
        관리자 권한을 주지 않고
        서버에서 ADMIN_EMAIL 재검증
      */

      const response =
        await fetch(
          "/api/admin/me",
          {
            headers: {
              Authorization:
                `Bearer ${data.session.access_token}`,
            },
            cache:
              "no-store",
          }
        );

      const result =
        await response.json();

      if (
        !response.ok ||
        !result.success
      ) {
        await supabase.auth.signOut();

        throw new Error(
          result.message ||
            "관리자 권한이 없습니다."
        );
      }

      router.replace(
        "/admin"
      );
    } catch (error) {
      setErrorMessage(
        error.message ||
          "로그인 중 오류가 발생했습니다."
      );
    } finally {
      setLoading(false);
    }
  }


  if (checking) {
    return (
      <main
        className={
          styles.authPage
        }
      >
        <div
          className={
            styles.loadingCard
          }
        >
          관리자 정보를 확인하고 있습니다.
        </div>
      </main>
    );
  }


  return (
    <main
      className={
        styles.authPage
      }
    >
      <section
        className={
          styles.authCard
        }
      >
        <div
          className={
            styles.authBrand
          }
        >
          <div
            className={
              styles.brandMark
            }
          >
            O
          </div>

          <div>
            <p>
              OPENING PROFILE
            </p>

            <h1>
              관리자 로그인
            </h1>
          </div>
        </div>


        <p
          className={
            styles.authDescription
          }
        >
          개원성향진단 참여자 및
          결과를 관리합니다.
        </p>


        <form
          onSubmit={
            handleLogin
          }
        >
          <div
            className={
              styles.authField
            }
          >
            <label
              htmlFor="admin-email"
            >
              이메일
            </label>

            <input
              id="admin-email"
              type="email"

              placeholder="회사 이메일"

              value={email}

              autoComplete="email"

              onChange={(
                event
              ) =>
                setEmail(
                  event.target.value
                )
              }
            />
          </div>


          <div
            className={
              styles.authField
            }
          >
            <label
              htmlFor="admin-password"
            >
              비밀번호
            </label>

            <input
              id="admin-password"

              type="password"

              placeholder="비밀번호"

              value={password}

              autoComplete="current-password"

              onChange={(
                event
              ) =>
                setPassword(
                  event.target.value
                )
              }
            />
          </div>


          {errorMessage && (
            <div
              className={
                styles.authError
              }
            >
              {errorMessage}
            </div>
          )}


          <button
            type="submit"

            className={
              styles.authButton
            }

            disabled={
              loading
            }
          >
            {loading
              ? "로그인 중..."
              : "관리자 로그인"}
          </button>
        </form>


        <p
          className={
            styles.authFooter
          }
        >
          허가된 관리자 계정만
          접근할 수 있습니다.
        </p>
      </section>
    </main>
  );
}
