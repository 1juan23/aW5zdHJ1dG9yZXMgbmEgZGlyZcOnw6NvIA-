import { Card, CardContent } from "@/components/ui/card";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    id: 1,
    name: "Juliana Mendes",
    photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=48&h=48&fit=crop&crop=face&q=80&fm=webp",
    city: "São Paulo, SP",
    rating: 5,
    text: "Tinha muito medo de dirigir e depois de 3 meses com meu instrutor da plataforma, já estou rodando sozinha! Super recomendo.",
    instructor: "Carlos Silva",
  },
  {
    id: 2,
    name: "Roberto Almeida",
    photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=48&h=48&fit=crop&crop=face&q=80&fm=webp",
    city: "Rio de Janeiro, RJ",
    rating: 5,
    text: "Precisava renovar minha CNH e a instrutora me ajudou muito na preparação. Passei de primeira no exame prático!",
    instructor: "Maria Santos",
  },
  {
    id: 3,
    name: "Camila Ferreira",
    photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=48&h=48&fit=crop&crop=face&q=80&fm=webp",
    city: "Belo Horizonte, MG",
    rating: 5,
    text: "A plataforma facilitou muito encontrar um profissional de confiança. O atendimento foi excelente do início ao fim.",
    instructor: "Pedro Oliveira",
  },
];

export function Testimonials() {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            O que nossos alunos dizem
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Histórias reais de pessoas que encontraram seus instrutores através da nossa plataforma.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <Card 
              key={testimonial.id} 
              variant="elevated"
              className="animate-fade-in-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardContent className="p-6">
                {/* Quote Icon */}
                <Quote className="h-8 w-8 text-accent/30 mb-4" />

                {/* Rating */}
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-warning text-warning" />
                  ))}
                </div>

                {/* Text */}
                <p className="text-foreground leading-relaxed mb-6">
                  "{testimonial.text}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-3 pt-4 border-t">
                  <img
                    src={testimonial.photo}
                    alt={testimonial.name}
                    width="48"
                    height="48"
                    loading="lazy"
                    decoding="async"
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-medium text-foreground">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Aluna de {testimonial.instructor} • {testimonial.city}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
