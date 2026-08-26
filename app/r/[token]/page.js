import {
  createClient,
} from "@supabase/supabase-js";

import {
  notFound,
} from "next/navigation";

import styles from "./result.module.css";


export const metadata = {
  title:
    "개원성향진단 결과 | 오스템임플란트",

  description:
    "오스템임플란트 개원성향진단 결과",

  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};


export const dynamic =
  "force-dynamic";


const TYPE_INFO = {
  stable: {
    label:
      "안정정착형",

    emoji:
      "🏠",

    title:
      "오래 갈수록 강한 병원을 만드는 원장님",

    description:
      "단기적인 성과보다 안정적인 운영과 꾸준한 환자 확보를 중요하게 생각하는 성향입니다.",

    recommendation:
      "화려한 메인상권보다 꾸준한 환자가 쌓이는 주거상권이 잘 맞습니다.",
  },

  aggressive: {
    label:
      "집중공격형",

    emoji:
      "🚀",

    title:
      "할 거라면 제대로, 빠르게 성장하는 원장님",

    description:
      "좋은 기회가 보이면 적극적으로 투자하고 빠른 성장과 높은 성과를 추구하는 성향입니다.",

    recommendation:
      "좋은 입지를 잡고 적극적으로 투자해 빠르게 성장하는 전략이 잘 맞습니다.",
  },

  analytical: {
    label:
      "데이터분석형",

    emoji:
      "📊",

    title:
      "감보다 숫자가 먼저인 전략가 원장님",

    description:
      "직감보다 객관적인 데이터와 투자 대비 효율을 확인한 뒤 의사결정하는 성향입니다.",

    recommendation:
      "좋은 자리보다 데이터를 통해 원장님에게 가장 유리한 자리를 찾는 것이 좋습니다.",
  },

  pioneer: {
    label:
      "선점개척형",

    emoji:
      "🌱",

    title:
      "남들이 들어가기 전에 먼저 기회를 잡는 원장님",

    description:
      "현재의 완성도보다 미래 성장 가능성을 중요하게 보고 새로운 기회를 선점하려는 성향입니다.",

    recommendation:
      "이미 완성된 상권보다 앞으로 커질 지역을 한발 먼저 선점하는 전략이 잘 맞습니다.",
  },
};


function getSupabaseAdmin() {
  const supabaseUrl =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const supabaseSecretKey =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (
    !supabaseUrl ||
    !supabaseSecretKey
  ) {
    throw new Error(
      "Supabase 서버 환경변수가 설정되어 있지 않습니다."
    );
  }

  return createClient(
    supabaseUrl,
    supabaseSecretKey,
    {
      auth: {
        persistSession:
          false,

        autoRefreshToken:
          false,
      },
    }
  );
}


function getTypeKeyFromLabel(
  label
) {
  return (
    Object.keys(
      TYPE_INFO
    ).find(
      (key) =>
        TYPE_INFO[key]
          .label ===
        label
    ) || null
  );
}


export default async function ResultPage({
  params,
}) {
  const resolvedParams =
    await params;

  const token =
    resolvedParams?.token;

  if (!token) {
    notFound();
  }


  /*
   * UUID 형식 확인
   */

  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (
    !uuidPattern.test(
      token
    )
  ) {
    notFound();
  }


  const supabase =
    getSupabaseAdmin();


  /*
   * 개인정보는 가져오지 않습니다.
   *
   * 이름
   * 휴대폰번호
   * 면허번호
   *
   * 모두 SELECT 대상에서 제외
   */

  const {
    data,
    error,
  } = await supabase
    .from(
      "diagnosis_responses"
    )
    .select(`
      result_type,
      result_score,
      secondary_type,
      secondary_score,
      type_scores,
      completed
    `)
    .eq(
      "result_token",
      token
    )
    .eq(
      "completed",
      true
    )
    .maybeSingle();


  if (
    error ||
    !data
  ) {
    console.error(
      "Result page error:",
      error
    );

    notFound();
  }


  const primaryType =
    getTypeKeyFromLabel(
      data.result_type
    );


  if (!primaryType) {
    notFound();
  }


  const secondaryType =
    data.secondary_type
      ? getTypeKeyFromLabel(
          data.secondary_type
        )
      : null;


  const primaryInfo =
    TYPE_INFO[
      primaryType
    ];


  const secondaryInfo =
    secondaryType
      ? TYPE_INFO[
          secondaryType
        ]
      : null;


  const typeScores =
    data.type_scores &&
    typeof data.type_scores ===
      "object"
      ? data.type_scores
      : {};


  return (
    <main
      className={
        styles.page
      }
    >

      <div
        className={
          styles.container
        }
      >

        {/* 상단 */}

        <div
          className={
            styles.brand
          }
        >
          OSSTEM IMPLANT
        </div>


        <div
          className={
            styles.profileLabel
          }
        >
          YOUR OPENING PROFILE
        </div>


        <p
          className={
            styles.intro
          }
        >
          원장님의 개원 성향은
        </p>


        {/* 메인 결과 */}

        <div
          className={
            styles.typeTitle
          }
        >

          <span
            className={
              styles.emoji
            }
          >
            {
              primaryInfo
                .emoji
            }
          </span>

          <h1>
            {
              primaryInfo
                .label
            }
          </h1>

        </div>


        <h2
          className={
            styles.title
          }
        >
          {
            primaryInfo
              .title
          }
        </h2>


        <p
          className={
            styles.description
          }
        >
          {
            primaryInfo
              .description
          }
        </p>


        {/* 추천 개원 방향 */}

        <section
          className={
            styles.recommendation
          }
        >

          <div
            className={
              styles.sectionTitle
            }
          >
            💡 추천 개원 방향
          </div>

          <p>
            {
              primaryInfo
                .recommendation
            }
          </p>

        </section>


        {/* 보조 성향 */}

        {
          secondaryInfo &&
          (

            <section
              className={
                styles.secondary
              }
            >

              <div
                className={
                  styles.secondaryLabel
                }
              >
                함께 나타난 보조 성향
              </div>

              <strong>
                {
                  secondaryInfo
                    .emoji
                }
                {" "}
                {
                  secondaryInfo
                    .label
                }
              </strong>

              <p>
                주 성향과 함께{" "}
                {
                  secondaryInfo
                    .label
                }{" "}
                성향도 나타났습니다.
              </p>

            </section>

          )
        }


        {/* 유형별 점수 */}

        <section
          className={
            styles.scoreCard
          }
        >

          <h3>
            개원성향 분석
          </h3>


          {
            Object.entries(
              TYPE_INFO
            ).map(
              ([
                type,
                info,
              ]) => {

                const score =
                  Number(
                    typeScores[
                      type
                    ] || 0
                  );


                const percentage =
                  Math.min(
                    100,

                    Math.round(
                      (
                        score /
                        14
                      ) *
                        100
                    )
                  );


                return (

                  <div
                    key={
                      type
                    }
                    className={
                      styles.scoreRow
                    }
                  >

                    <div
                      className={
                        styles.scoreInfo
                      }
                    >

                      <span>
                        {
                          info.emoji
                        }
                        {" "}
                        {
                          info.label
                        }
                      </span>

                      <strong>
                        {
                          score
                        }
                        점
                      </strong>

                    </div>


                    <div
                      className={
                        styles.track
                      }
                    >

                      <div
                        className={
                          styles.fill
                        }
                        style={{
                          width:
                            `${percentage}%`,
                        }}
                      />

                    </div>

                  </div>

                );
              }
            )
          }

        </section>


        {/* 하단 */}

        <div
          className={
            styles.footer
          }
        >
          오스템임플란트
          <br />
          개원성향진단
        </div>

      </div>

    </main>
  );
}
