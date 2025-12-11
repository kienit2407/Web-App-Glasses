/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { z } from 'zod'
import { zodResolver } from "@hookform/resolvers/zod"
import { Mail, Lock, Eye, EyeOff, User } from "lucide-react";
import { GitHubIcon, GoogleIcon } from "@/assets/icons";
import { Link, replace, useLocation, useNavigate } from "react-router-dom";
import { Spinner } from "@/components/ui/spinner";
import { Button, Card, Divider, Form, Input, Tabs } from 'antd';
import { useAuth } from "@/hooks/use-auth";
import { API_BASE_URL } from "@/app/config";
import { openPopup } from "@/utils/window";

type LoginFormValues = {
  email: string;
  password: string;
};

type RegisterFormValues = {
  display_name: string;
  email: string;
  password: string;
};


const Login = () => {
  const location = useLocation() // Lấy location hiện tại CỦA TRANG LOGIN
  const from = location.state?.from?.pathname || "/" // lấy cái vị trí mà user đang ở chỗ mà muốn vào nhưng bị đang nhập chặn. lại
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const { login, signup, isLoading, user, setAccessToken, fetchMe } = useAuth()
  const navigate = useNavigate()


  useEffect(() => {
    // Khi `user` thay đổi (từ null -> có data)
    if (user) {
      // Logic kết hợp:
      // Nếu user là admin VÀ họ tự vào trang login (from = '/')
      // thì ưu tiên đưa họ về /admin
      if (user.roles.includes('admin') && from === '/') {
        navigate('/admin', { replace: true });
      } else {
        // Ngược lại (user thường, HOẶC admin bị đá từ một trang con)
        // cứ trả họ về đúng nơi họ muốn (biến `from`)

        navigate(from, { replace: true });
      }
    }
  }, [user, navigate, from]); // Lắng nghe sự thay đổi của user
  const handleLoginFinish = async (values: LoginFormValues) => {
    if (isLoading) return;
    await login(values);
  };

  const handleRegisterFinish = async (values: RegisterFormValues) => {
    if (isLoading) return;
    await signup(values);
  };
  const handleLoginWithGoogle = () => {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    const url = `${API_BASE_URL}/auth/google?${params.toString()}`;
    openPopup(url, "Google Login", 500, 600);
    // window.location.href = `${API_BASE_URL}/auth/google?${params.toString()}`;
  };
  // Listen cho message từ popup
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.origin !== API_BASE_URL) return; // tránh XSS
      const data = event.data as any;
      if (data?.type === "OAUTH_SUCCESS") {
        const { accessToken, from } = data.payload;
        (async () => {
          setAccessToken(accessToken);
          await fetchMe();
          navigate(from || "/", { replace: true });
        })();
      }
      if (data?.type === "OAUTH_ERROR") {
      console.log("OAuth error:", data.payload);
      // toast 1 cái, còn popup thì đã tự window.close() rồi
      // vd:
      // toast.error("Bạn đã huỷ đăng nhập Google");
    }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [setAccessToken, fetchMe, navigate]);



  const handleLoginWithGithub = () => {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    // window.location.href = `${API_BASE_URL}/auth/github?${params.toString()}`;
    const url = `${API_BASE_URL}/auth/github?${params.toString()}`;
    openPopup(url, "Github Login", 500, 600);
  };
  const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*/;
  const tabItems = [
    {
      key: "login",
      label: "Đăng nhập",
      children: (
        <Card className="w-full">
          <h2 className="text-lg font-semibold mb-1">Đăng nhập</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Nhập thông tin tài khoản để đăng nhập
          </p>

          <Form<LoginFormValues>
            layout="vertical"
            onFinish={handleLoginFinish}
          >
            {/* EMAIL */}
            <Form.Item<LoginFormValues>
              label="Email"
              name="email"
              rules={[
                { required: true, message: "Email là bắt buộc" },
                { type: "email", message: "Email không hợp lệ" },
              ]}
            >
              <Input
                prefix={<Mail className="w-4 h-8 text-muted-foreground" />}
                placeholder="email@example.com"
                disabled={isLoading}
                className="!rounded-2xl text-sm font-semibold"
              />
            </Form.Item>

            {/* PASSWORD */}
            <Form.Item<LoginFormValues>
              label="Mật khẩu"
              name="password"
              rules={[
                { required: true, message: "Mật khẩu là bắt buộc" },
                { min: 8, message: "Mật khẩu phải có ít nhất 8 ký tự" },
                {
                  pattern: passwordPattern,
                  message: "Mật khẩu phải có chữ hoa, chữ thường và số",
                },
              ]}
            >
              <Input.Password
                prefix={<Lock className="w-4 h-8 text-muted-foreground" />}
                placeholder="••••••••"
                disabled={isLoading}
                className="!rounded-2xl text-sm font-semibold"
              />
            </Form.Item>

            <div className="flex items-center justify-end text-sm mb-4">
              <button
                type="button"
                className="text-primary hover:underline"
              >
                Quên mật khẩu?
              </button>
            </div>
            <Button
              // Thêm các class sau:
              // 1. bg-gradient-to-r from-... to-... : Định nghĩa màu gradient
              // 2. border-none: Xóa viền mặc định của Antd
              // 3. text-white: Đổi màu chữ thành trắng
              // 4. hover:opacity-80: Hiệu ứng khi di chuột (làm mờ đi chút thay vì đổi màu)
              className="h-[40px] border-none !text-white !bg-gradient-to-tl from-[#00c6ff] to-[#0072ff] rounded-2xl"
              htmlType="submit"
              block
            >
              {isLoading ? <Spinner /> : 'Đăng nhập'}
            </Button>
          </Form>
          <Divider ><span className="text-sm text-gray-500 font-normal">
            Hoặc
          </span></Divider>

          <div className="flex flex-col gap-3 w-full">
            {/* Nút Google: Thường là nền trắng, chữ đen, có viền */}
            <Button
              className="h-[40px] flex items-center justify-center gap-2 border-gray-300 shadow-sm hover:bg-gray-50 rounded-2xl"
              block // AntD: block = width 100%
              onClick={handleLoginWithGoogle}
            >
              <GoogleIcon size={20} />
              <span>Đăng nhập bằng Google</span>
            </Button>

            {/* Nút GitHub: Thường là nền đen, chữ trắng */}
            <Button
              className="h-[40px] flex items-center justify-center gap-2 border-gray-300 shadow-sm hover:bg-gray-50 rounded-2xl"
              block
              onClick={handleLoginWithGithub}
            >
              <GitHubIcon size={20} />
              <span>Đăng nhập bằng GitHub</span>
            </Button>
          </div>
        </Card>
      ),
    },
    {
      key: "register",
      label: "Đăng ký",
      children: (
        <Card className="w-full">
          <h2 className="text-lg font-semibold mb-1">Đăng ký</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Tạo tài khoản mới để bắt đầu mua sắm
          </p>

          <Form<RegisterFormValues>
            layout="vertical"
            onFinish={handleRegisterFinish}
          >
            {/* DISPLAY NAME */}
            <Form.Item<RegisterFormValues>
              label="Họ và tên"
              name="display_name"
              rules={[
                { required: true, message: "Họ tên là bắt buộc" },
                {
                  min: 3,
                  message: "Họ tên phải có ít nhất 3 ký tự",
                },
              ]}
            >
              <Input
                prefix={<User className="w-4 h-8 text-muted-foreground" />}
                placeholder="Nguyễn Văn A"
                disabled={isLoading}
                className="!rounded-2xl text-sm font-semibold"
              />
            </Form.Item>

            {/* EMAIL */}
            <Form.Item<RegisterFormValues>
              label="Email"
              name="email"
              rules={[
                { required: true, message: "Email là bắt buộc" },
                { type: "email", message: "Email không hợp lệ" },
              ]}
            >
              <Input
                prefix={<Mail className="w-4 h-8 text-muted-foreground" />}
                placeholder="email@example.com"
                disabled={isLoading}
                className="!rounded-2xl text-sm font-semibold"
              />
            </Form.Item>

            {/* PASSWORD */}
            <Form.Item<RegisterFormValues>
              label="Mật khẩu"
              name="password"
              rules={[
                { required: true, message: "Mật khẩu là bắt buộc" },
                { min: 8, message: "Mật khẩu phải có ít nhất 8 ký tự" },
                {
                  pattern: passwordPattern,
                  message: "Mật khẩu phải có chữ hoa, chữ thường và số",
                },
              ]}
            >
              <Input.Password
                prefix={<Lock className="w-4 h-8 text-muted-foreground !rounded-2xl" />}
                placeholder="••••••••"
                disabled={isLoading}
                className="!rounded-2xl text-sm font-semibold"
              />
            </Form.Item>

            <Button
              type="primary"
              htmlType="submit"
              loading={isLoading}
              className="h-[40px] border-none !text-white !bg-gradient-to-tl from-[#00c6ff] to-[#0072ff] rounded-2xl"
              block
            >
              {isLoading ? <Spinner /> : 'Đăng nhập'}
            </Button>

            <p className="text-center text-xs text-muted-foreground mt-4">
              Bằng việc đăng ký, bạn đồng ý với{" "}
              <button
                type="button"
                className="text-primary hover:underline"
              >
                Điều khoản sử dụng
              </button>{" "}
              và{" "}
              <button
                type="button"
                className="text-primary hover:underline"
              >
                Chính sách bảo mật
              </button>
            </p>
          </Form>
          <Divider ><span className="text-sm text-gray-500 font-normal">
            Hoặc
          </span></Divider>

          <div className="flex flex-col gap-4 w-full">
            {/* Nút Google: Thường là nền trắng, chữ đen, có viền */}
            <Button
              className="h-[40px] flex items-center justify-center gap-2 border-gray-300 shadow-sm hover:bg-gray-50 rounded-2xl"
              block // AntD: block = width 100%
              onClick={handleLoginWithGoogle}
            >
              <GoogleIcon size={20} />
              <span>Đăng ký bằng Google</span>
            </Button>

            {/* Nút GitHub: Thường là nền đen, chữ trắng */}
            <Button
              className="h-[40px] flex items-center justify-center gap-2 border-gray-300 shadow-sm hover:bg-gray-50 rounded-2xl"
              block
              onClick={handleLoginWithGithub}
            >
              <GitHubIcon size={20} />
              <span>Đăng ký bằng GitHub</span>
            </Button>
          </div>
        </Card>
      ),
    },
  ];
  return (
    <div className="w-full">
      <div className="container mx-auto px-4">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              Chào mừng trở lại
            </h1>
            <p className="text-muted-foreground">
              Đăng nhập để trải nghiệm mua sắm tốt nhất
            </p>
          </div>

          <Tabs
            centered
            className="w-full"
            defaultActiveKey="login"
            items={tabItems}
          />

          <div className="text-center mt-6">
            <Link
              to="/"
              className="text-sm text-muted-foreground hover:text-primary"
            >
              ← Quay lại trang chủ
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
