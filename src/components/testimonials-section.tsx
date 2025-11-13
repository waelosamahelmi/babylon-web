import { useLanguage } from "@/lib/language-context";
import { useRestaurant } from "@/lib/restaurant-context";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Quote } from "lucide-react";

export function TestimonialsSection() {
  const { language, t } = useLanguage();
  const { config } = useRestaurant();

  if (!config) {
    return (
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p>Loading testimonials...</p>
          </div>
        </div>
      </section>
    );
  }

  const testimonials = [
    {
      name: "Maria Virtanen",
      rating: 5,
      comment: {
        fi: "Paras pizza Helsingissä! Aina tuoreita aineksia ja nopea toimitus. Suosittelen lämpimästi!",
        en: "Best pizza in Helsinki! Always fresh ingredients and fast delivery. Highly recommend!"
      },
      location: "Helsinki"
    },
    {
      name: "Jukka Korhonen",
      rating: 5,
      comment: {
        fi: "Kebab oli mahtava ja palvelu ystävällistä. Tämä on meidän uusi suosikkipizzeria!",
        en: "The kebab was amazing and the service was friendly. This is our new favorite restaurant!"
      },
      location: "Espoo"
    },
    {
      name: "Anna Lindström",
      rating: 5,
      comment: {
        fi: "Tilaussysteemi toimii sujuvasti ja ruoka saapuu aina ajallaan. Kiitos hyvästä palvelusta!",
        en: "The ordering system works smoothly and food always arrives on time. Thanks for great service!"
      },
      location: "Vantaa"
    },
    {
      name: "Mikael Jönsson",
      rating: 5,
      comment: {
        fi: "Erinomaista ruokaa ja kohtuullisia hintoja. Buffalo wings ovat parhaita mitä olen maistanut!",
        en: "Excellent food and reasonable prices. Buffalo wings are the best I've ever tasted!"
      },
      location: "Helsinki"
    }
  ];

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? "text-yellow-400 fill-current" : "text-gray-300"
        }`}
      />
    ));
  };

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {t("Asiakkaiden Kokemuksia", "Customer Testimonials")}
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            {t(
              "Lue mitä asiakkaamme sanovat meistä ja tutustu heidän kokemuksiinsa",
              "Read what our customers say about us and discover their experiences"
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <Quote 
                    className="w-8 h-8 flex-shrink-0" 
                    style={{ color: config.theme.secondary }}
                  />
                  <div className="flex space-x-1">
                    {renderStars(testimonial.rating)}
                  </div>
                </div>
                
                <p className="text-gray-700 mb-4 italic">
                  "{language === "fi" ? testimonial.comment.fi : testimonial.comment.en}"
                </p>
                
                <div className="border-t pt-4">
                  <p className="font-semibold text-gray-900">{testimonial.name}</p>
                  <p className="text-sm text-gray-500">{testimonial.location}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4">
            {t("Haluatko jakaa oman kokemuksesi?", "Want to share your experience?")}
          </p>
          <a
            href="contact"
            className="inline-flex items-center px-6 py-3 border transition-colors rounded-lg font-medium"
            style={{
              borderColor: config.theme.secondary,
              color: config.theme.secondary,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = config.theme.secondary;
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = config.theme.secondary;
            }}
          >
            {t("Jätä arvostelu", "Leave a Review")}
          </a>
        </div>
      </div>
    </section>
  );
}