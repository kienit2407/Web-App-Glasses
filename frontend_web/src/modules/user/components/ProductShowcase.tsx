import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Image } from "antd";

interface ProductShowcaseProps {
  title: string;
  imgSrc: string;
  productId: string;
  slug: string,
  reverse?: boolean;
}

export const ProductShowcase = ({
  title,
  imgSrc,
  productId,
  slug,
  reverse = false,
}: ProductShowcaseProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className={`py-20 ${reverse ? "bg-muted/30" : "bg-background"}`}
    >
      <div className="container mx-auto px-4">
        <div
          className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${
            reverse ? "lg:grid-flow-dense" : ""
          }`}
        >
          {/* Video */}
          <div
            className={`relative ${reverse ? "lg:col-start-2" : ""} ${
              isVisible ? "animate-scale-in" : "opacity-0"
            }`}
          >
            <div className="relative rounded-2xl overflow-hidden shadow-elegant aspect-square">
              <Image
                className="bg-cover"
                src={imgSrc}
              />
            </div>
            {/* Decorative Elements */}
            <div className="absolute -z-10 -top-4 -right-4 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
            <div className="absolute -z-10 -bottom-4 -left-4 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl" />
          </div>

          {/* Content */}
          <div
            className={`space-y-6 ${reverse ? "lg:col-start-1 lg:row-start-1" : ""} ${
              isVisible
                ? reverse
                  ? "animate-slide-in-right"
                  : "animate-slide-in-left"
                : "opacity-0"
            }`}
          >
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-10">
              {title}
            </h2>
            <Link to={`/products/${slug}/${productId}`}>
              <Button variant="hero" size="lg" className="group">
                Xem chi tiết
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
