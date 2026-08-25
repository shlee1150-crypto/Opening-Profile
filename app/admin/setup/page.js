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


export default function AdminSetupPage() {
  const router =
    useRouter();

  const [
    status,
    setStatus,
  ] = useState(
    "checking"
  );

  const [
    email,
    setEmail,
  ] = useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    passwordConfirm,
    setPasswordConfirm,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");


  useEffect(() => {
    let active = true;

    const supabase =
      getSupabaseBrowser();


    /* ======================================
       URL 자체에 Supabase 에러가 있을 경우
    ====================================== */

    const hashParams =
      new URLSearchParams(
        window.location.hash.replace(
          /^#/,
          ""
        )
      );

    const queryParams =
      new URLSearchParams(
        window.location.search
      );

    const urlError =
      hashParams.get(
        "error_description"
      ) ||
      queryParams.get(
        "error_description"
      );

    if (urlError) {
      setErrorMessage(
        decodeURIComponent(
          urlError.replace(
            /\+/g,
            " "
          )
        )
      );

      setStatus(
        "invalid"
      );

      return;
    }


    async function verifySession(
      session
    ) {
      if (
        !session ||
        !active
      ) {
        return false;
      }

      try {
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

        const result =
          await response.json();

        if (
          !response.ok ||
          !result.success
        ) {
          if (
            response.status ===
            403
          ) {
            await supabase.auth.signOut();
          }

          throw new Error(
            result.message ||
              "관리자 인증에 실패했습니다."
          );
        }

        if (!active) {
          return false;
        }

        setEmail(
          result.email || ""
        );

        setStatus(
          "ready"
        );

        return true;
      } catch (error) {
        if (active) {
          setErrorMessage(
            error.message
          );

          setStatus(
            "invalid"
          );
        }

        return false;
      }
    }


    /*
      초대 URL의 세션 처리가
      완료될 때를 기다림
    */

    const {
      data: listener,
    } =
      supabase.auth.onAuthStateChange(
        (
          event,
          session
        ) => {
          if (
            session &&
            active
          ) {
            setTimeout(
              () =>
                verifySession(
                  session
                ),
              0
            );
          }
        }
      );


    async function initialize() {
      /*
        detectSessionInUrl이
        URL fragment를 처리할 시간을
        잠깐 확보
      */

      await new Promise(
        (resolve) =>
          setTimeout(
            resolve,
            500
          )
      );

      const {
        data: {
          session,
        },
      } =
        await supabase.auth.getSession();

      if (session) {
        await verifySession(
          session
        );

        return;
      }

      /*
        조금 더 기다렸다가
        한 번 재확인
      */

      await new Promise(
        (resolve) =>
          setTimeout(
            resolve,
            700
          )
      );

      const {
        data: {
          session:
            secondSession,
        },
      } =
        await supabase.auth.getSession();

      if (
        secondSession
      ) {
        await verifySession(
          secondSession
        );

        return;
      }

      if (active) {
        setErrorMessage(
          "초대 링크가 만료되었거나 유효하지 않습니다. 새 초대 메일을 받아주세요."
        );

        setStatus(
          "invalid"
        );
      }
    }

    initialize();


    return () => {
      active = false;

      listener
        .subscription
        .unsubscribe();
    };
  }, []);


  /* ========================================
     비밀번호 설정
  ======================================== */

  async function handleSetup(
    event
  ) {
    event.preventDefault();

    setErrorMessage("");

    if (
      password.length <
      8
    ) {
      setErrorMessage(
        "비밀번호는 8자 이상으로 설정해주세요."
      );

      return;
    }

    if (
      password !==
      passwordConfirm
    ) {
      setErrorMessage(
        "비밀번호가 서로 일치하지 않습니다."
      );

      return;
    }

    try {
      setLoading(true);

      const supabase =
        getSupabaseBrowser();

      const {
        error,
      } =
        await supabase.auth.updateUser(
          {
            password,
          }
        );

      if (error) {
        throw error;
      }

      /*
        설정 후 현재 세션을 유지하고
        바로 관리자 페이지 이동
      */

      router.replace(
        "/admin"
      );
    } catch (error) {
      console.error(error);

      setErrorMessage(
        error.message ||
          "비밀번호 설정 중 오류가 발생했습니다."
      );
    } finally {
      setLoading(false);
    }
  }


  if (
    status ===
    "checking"
  ) {
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
          초대 정보를 확인하고 있습니다.
        </div>
      </main>
    );
  }


  if (
    status ===
    "invalid"
  ) {
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
              !
            </div>

            <div>
              <p>
                OPENING PROFILE
              </p>

              <h1>
                초대 확인 실패
              </h1>
            </div>
          </div>


          <div
            className={
              styles.authError
            }
          >
            {errorMessage}
          </div>


          <button
            type="button"

            className={
              styles.authSecondaryButton
            }

            onClick={() =>
              router.replace(
                "/admin/login"
              )
            }
          >
            관리자 로그인으로 이동
          </button>
        </section>
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
              관리자 계정 설정
            </h1>
          </div>
        </div>


        <p
          className={
            styles.authDescription
          }
        >
          관리자 로그인에 사용할
          비밀번호를 설정해주세요.
        </p>


        <div
          className={
            styles.setupEmail
          }
        >
          {email}
        </div>


        <form
          onSubmit={
            handleSetup
          }
        >
          <div
            className={
              styles.authField
            }
          >
            <label
              htmlFor="password"
            >
              새 비밀번호
            </label>

            <input
              id="password"

              type="password"

              value={password}

              placeholder="8자 이상"

              autoComplete="new-password"

              onChange={(
                event
              ) =>
                setPassword(
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
              htmlFor="password-confirm"
            >
              새 비밀번호 확인
            </label>

            <input
              id="password-confirm"

              type="password"

              value={
                passwordConfirm
              }

              placeholder="비밀번호 다시 입력"

              autoComplete="new-password"

              onChange={(
                event
              ) =>
                setPasswordConfirm(
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
              ? "설정 중..."
              : "비밀번호 설정 완료"}
          </button>
        </form>
      </section>
    </main>
  );
}
