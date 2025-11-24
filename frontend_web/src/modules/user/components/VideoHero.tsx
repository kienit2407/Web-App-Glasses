import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export const VideoHero = () => {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const opacity = Math.max(0, 1 - scrollY / 500);
  const scale = Math.max(0.95, 1 - scrollY / 2000);

  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      {/* Video Background */}
      <div
        className="absolute inset-0 z-0"
        style={{
          transform: `scale(${scale})`,
          opacity: opacity
        }}
      >
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
        >
          {/* Thay src bằng link video .mp4 và type="video/mp4" */}
          <source
            src="video_hero.mp4"
            type="video/mp4"
          />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-background/50 to-white/10"/>
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center">
        <div
          className="space-y-6 animate-fade-in-up"
          style={{
            transform: `translateY(${scrollY * 0.5}px)`,
          }}
        >
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-primary-foreground">
            Khám Phá Thế Giới
            <br />
            <span className="text-gradient bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-500 to-pink-500">
              Qua Tầm Nhìn Mới
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-primary-foreground/90 max-w-3xl mx-auto">
            Bộ sưu tập kính cao cấp với công nghệ tiên tiến,
            thiết kế độc đáo và phong cách vượt thời gian.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4 items-center">
            <Link to="/products">
              <Button
                variant="hero"
                size="lg"
                className="min-w-[200px] text-lg group"
              >
                Khám phá ngay
                <ArrowRight className="ml-2 mt-1 h-5 w-5 group-hover:translate-x-1 hover:scale-50 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-float">
        <div className="flex flex-col items-center gap-2 text-primary-foreground/60">
          <span className="text-sm">Cuộn xuống</span>
          <div className="w-6 h-10 border-2 border-current rounded-full flex items-start justify-center p-2">
            <div className="w-1 h-3 bg-current rounded-full animate-bounce" />
          </div>
        </div>
      </div>
    </section>
  );
};
