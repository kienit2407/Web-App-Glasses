import { useEffect, useState } from "react";
import { z } from 'zod'
import { zodResolver } from "@hookform/resolvers/zod"
import { Mail, Lock, Eye, EyeOff, User } from "lucide-react";

import { Link, replace, useLocation, useNavigate } from "react-router-dom";
import { Spinner } from "@/components/ui/spinner";
import { Button, Card, Form, Input, Tabs } from 'antd';
import { useAuth } from "@/hooks/use-auth";

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

  const { login, signup, isLoading, user } = useAuth()
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
                prefix={<Mail className="w-4 h-4 text-muted-foreground" />}
                placeholder="email@example.com"
                disabled={isLoading}
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
                prefix={<Lock className="w-4 h-4 text-muted-foreground" />}
                placeholder="••••••••"
                disabled={isLoading}
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
              type="primary"
              htmlType="submit"
              loading={isLoading}
              block
            >
              Đăng nhập
            </Button>
          </Form>
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
                prefix={<User className="w-4 h-4 text-muted-foreground" />}
                placeholder="Nguyễn Văn A"
                disabled={isLoading}
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
                prefix={<Mail className="w-4 h-4 text-muted-foreground" />}
                placeholder="email@example.com"
                disabled={isLoading}
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
                prefix={<Lock className="w-4 h-4 text-muted-foreground" />}
                placeholder="••••••••"
                disabled={isLoading}
              />
            </Form.Item>

            <Button
              type="primary"
              htmlType="submit"
              loading={isLoading}
              block
            >
              Đăng ký
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
