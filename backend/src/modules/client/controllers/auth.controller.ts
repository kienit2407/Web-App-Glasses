import { NextFunction, Request, Response } from "express";
import { TryCatch } from "../../../utils/try_catch";
import { getPlatformFromReq } from "../../../utils/platform";
import { authService, SignIn, SignUp } from "../services/auth.service";
import { sendAsSuccess } from "../../../utils/send_status";
import { StatusCodes } from "http-status-codes";
import { getRefreshFromRequest, Platform } from "../../../utils/jwt";
import { normalizeIp } from "../../../utils/format_ip";
import axios from "axios";

const FRONTEND_URL = (process.env.NODE_BUILD === 'dev') ? process.env.FRONTEND_URL : process.env.FRONTEND_URL_PROD || 'http://localhost:3000'
const BACKEND_URL = (process.env.NODE_BUILD === 'dev') ? process.env.BACKEND_URL : process.env.BACKEND_URL_PROD || 'http://localhost:4000'
console.log('MÔI TRƯỜNG', process.env.NODE_BUILD, 'FRONTEND_URL:', FRONTEND_URL)
console.log('MÔI TRƯỜNG', process.env.NODE_BUILD, 'BACKEND_URL:', BACKEND_URL)

const signUp = TryCatch(async (req: Request, res: Response, next: NextFunction) => {
  const platform = getPlatformFromReq(req)
  const payload: SignUp = req.body
  const userAgent = req.headers["user-agent"] || "unknown"
  const rawIp =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    req.socket.remoteAddress ||
    null
  const ip = normalizeIp(rawIp)
  const result = await authService.signUp(payload, platform, res, { userAgent, ip })
  return sendAsSuccess(
    res,
    StatusCodes.CREATED,
    result,
    'Đăng ký thành công'
  )
})

const signIn = TryCatch(async (req: Request, res: Response, next: NextFunction) => {
  const payload: SignIn = req.body
  const platform = getPlatformFromReq(req)
  const userAgent = req.headers["user-agent"] || "unknown"

  const rawIp =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    req.socket.remoteAddress ||
    null
  const ip = normalizeIp(rawIp)
  console.log(userAgent)
  const result = await authService.signIn(payload, platform, res, { userAgent, ip })
  return sendAsSuccess(
    res,
    StatusCodes.OK,
    result,
    'Đăng nhập thành công'
  )
})

const logOut = TryCatch(async (req: Request, res: Response, _next: NextFunction) => {
  const platform = getPlatformFromReq(req)
  const rawRefresh = getRefreshFromRequest(req, platform) // Từ web hoặc mobile

  await authService.logOut(rawRefresh, platform, res)

  return sendAsSuccess(
    res,
    StatusCodes.OK,
    'Đăng xuất thành công'
  )
})
const refreshToken = TryCatch(async (req: Request, res: Response, _next: NextFunction) => {
  const platform = getPlatformFromReq(req)
  const rawRefresh = getRefreshFromRequest(req, platform)

  const result = await authService.refreshToken(rawRefresh, platform, res)

  return sendAsSuccess(
    res,
    StatusCodes.OK,
    result,
    'Làm mới token thành công'
  )
})
// 1) Redirect sang Google
const oauthGoogle = TryCatch(async (req: Request, res: Response) => {
  const from = (req.query.from as string) || '/';
  const redirectUri = `${BACKEND_URL}/auth/google/callback`;

  // ?platform=mobile từ Flutter
  const platformRaw = (req.query.platform as string | undefined)?.toLowerCase();
  const platform: Platform = platformRaw === 'mobile' ? 'mobile' : 'web';

  console.log('nền tảng hiện tại là:', platform);

  const stateObj = { from, platform };
  const state = JSON.stringify(stateObj);

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID as string,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'consent',
    state,
  });

  res.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  );
});

// 2) Callback từ Google
const oauthGoogleCallback = TryCatch(async (req: Request, res: Response) => {
  const { code, state, error} = req.query;
  const redirectUri = `${BACKEND_URL}/auth/google/callback`;

  let from = '/';
  let platform: Platform = 'web';

  if (typeof state === 'string') {
    try {
      const decoded = decodeURIComponent(state);
      const parsed = JSON.parse(decoded) as { from?: string; platform?: string };

      from = parsed.from || '/';
      platform = parsed.platform === 'mobile' ? 'mobile' : 'web';
    } catch (e) {
      console.error('Parse state error:', e);
    }
  }
  if (error) {
    console.log('Google OAuth error:', error);

    if (platform === 'web') {
      // Web: gửi message cho window opener và tự đóng popup
      return res.send(`
        <!DOCTYPE html>
        <html>
          <body>
            <script>
              window.opener && window.opener.postMessage(
                {
                  type: "OAUTH_ERROR",
                  payload: {
                    error: "${String(error)}",
                    from: "${from}"
                  }
                },
                "${FRONTEND_URL}"
              );
              window.close();
            </script>
          </body>
        </html>
      `);
    }
  }

  // Nếu vì lý do gì đó không có code luôn thì cũng coi như fail
  if (!code) {
    // Cho an toàn, cứ đóng popup
    return res.send(`
      <!DOCTYPE html>
      <html>
        <body>
          <script>
            window.close();
          </script>
        </body>
      </html>
    `);
  }
  // 1) Đổi code -> googleAccessToken
  const tokenRes = await axios.post(
    'https://oauth2.googleapis.com/token',
    new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID as string,
      client_secret: process.env.GOOGLE_CLIENT_SECRET as string,
      code: String(code),
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );

  const googleAccessToken = tokenRes.data.access_token as string;

  const userAgent = req.headers['user-agent'] || 'unknown';
  const rawIp =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    req.socket.remoteAddress ||
    null;
  const ip = normalizeIp(rawIp);

  //  Dùng platform lấy từ state, KHÔNG dùng getPlatformFromReq ở đây
  const { tokens } = await authService.signInWithGoogle(
    googleAccessToken,
    platform,
    res,
    { userAgent, ip }
  );

  // 2) Tuỳ platform mà trả về

  if (platform === 'web') {
    // Web: gửi HTML postMessage, popup window (giống Shopee web)
    return res.send(`
      <!DOCTYPE html>
      <html>
        <body>
          <script>
            window.opener && window.opener.postMessage(
              {
                type: "OAUTH_SUCCESS",
                payload: {
                  accessToken: "${tokens.accessToken}",
                  from: "${from}"
                }
              },
              "${FRONTEND_URL}"
            );
            window.close();
          </script>
        </body>
      </html>
    `);
  }

  // Mobile: redirect về deep link -> FlutterWebAuth2 bắt được & đóng popup
  const mobileRedirect = new URL('myshop://oauth-callback');
  mobileRedirect.searchParams.set('accessToken', tokens.accessToken);
  if (tokens.refreshToken) {
    mobileRedirect.searchParams.set('refreshToken', tokens.refreshToken);
  }
  mobileRedirect.searchParams.set('from', from);

  return res.redirect(mobileRedirect.toString()); // <= Quan trọng
});

// 3) Redirect sang GitHub
const oauthGithub = TryCatch(async (req: Request, res: Response) => {
  const from = (req.query.from as string) || '/';
  const redirectUri = `${BACKEND_URL}/auth/github/callback`;

  // Lấy platform từ query (?platform=mobile) giống Google
  const platformRaw = (req.query.platform as string | undefined)?.toLowerCase();
  const platform: Platform = platformRaw === 'mobile' ? 'mobile' : 'web';

  // Gói from + platform vào state
  const stateObj = { from, platform };
  const state = encodeURIComponent(JSON.stringify(stateObj));

  const params = new URLSearchParams({
    client_id:
      (process.env.NODE_BUILD === 'dev')
        ? (process.env.GITHUB_CLIENT_ID as string)
        : (process.env.GITHUB_CLIENT_ID_PROD as string),
    redirect_uri: redirectUri,
    scope: 'user:email',
    state, // JSON encode, có from + platform
  });

  res.redirect(
    `https://github.com/login/oauth/authorize?${params.toString()}`
  );
});


// 4) Callback GitHub
const oauthGithubCallback = TryCatch(async (req: Request, res: Response) => {
  const { code, state } = req.query;
  const redirectUri = `${BACKEND_URL}/auth/github/callback`;

  let from = '/';
  let platform: Platform = 'web';

  // ĐỌC lại from + platform từ state (giống Google callback)
  if (typeof state === 'string') {
    try {
      const decoded = decodeURIComponent(state);
      const parsed = JSON.parse(decoded) as { from?: string; platform?: string };

      from = parsed.from || '/';
      platform = parsed.platform === 'mobile' ? 'mobile' : 'web';
    } catch (e) {
      console.error('Parse state error (Github):', e);
      // fallback support cho state cũ kiểu chỉ là from
      from = (state as string) ? decodeURIComponent(state as string) : '/';
    }
  }

  // Đổi code sang GitHub access token
  const tokenRes = await axios.post(
    'https://github.com/login/oauth/access_token',
    {
      client_id:
        (process.env.NODE_BUILD === 'dev')
          ? (process.env.GITHUB_CLIENT_ID as string)
          : (process.env.GITHUB_CLIENT_ID_PROD as string),
      client_secret:
        (process.env.NODE_BUILD === 'dev')
          ? (process.env.GITHUB_CLIENT_SECRET as string)
          : (process.env.GITHUB_CLIENT_SECRET_PROD as string),
      code,
      redirect_uri: redirectUri,
    },
    { headers: { Accept: 'application/json' } }
  );

  const githubAccessToken = tokenRes.data.access_token as string;

  const userAgent = req.headers['user-agent'] || 'unknown';
  const rawIp =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    req.socket.remoteAddress ||
    null;
  const ip = normalizeIp(rawIp);

  // Dùng platform lấy từ state, KHÔNG dùng getPlatformFromReq nữa
  const { tokens } = await authService.signInWithGithub(
    githubAccessToken,
    platform,
    res,
    { userAgent, ip }
  );

  // WEB → postMessage + window.close (popup Shopee-style)
  if (platform === 'web') {
    const html = `
      <!DOCTYPE html>
      <html>
        <body>
          <script>
            window.opener && window.opener.postMessage(
              {
                type: "OAUTH_SUCCESS",
                payload: {
                  accessToken: "${tokens.accessToken}",
                  from: "${from}"
                }
              },
              "${FRONTEND_URL}"
            );
            window.close();
          </script>
        </body>
      </html>
    `;
    return res.send(html);
  }

  // MOBILE → deep link về app, FlutterWebAuth2 sẽ bắt & đóng WebView
  const mobileRedirect = new URL('myshop://oauth-callback');
  mobileRedirect.searchParams.set('accessToken', tokens.accessToken);
  if (tokens.refreshToken) {
    mobileRedirect.searchParams.set('refreshToken', tokens.refreshToken);
  }
  mobileRedirect.searchParams.set('from', from);

  return res.redirect(mobileRedirect.toString());
});

export const authController = {
  signUp,
  signIn,
  logOut,
  refreshToken,
  oauthGoogle,
  oauthGoogleCallback,
  oauthGithub,
  oauthGithubCallback,
}

