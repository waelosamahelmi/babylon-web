import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Phone } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/lib/language-context";

interface PhoneNumber {
  id: string;
  brand_name: string;
  phone_number: string;
  phone_label: string;
  phone_label_en: string;
  is_primary: boolean;
  display_order: number;
}

interface PhoneNumbersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PhoneNumbersModal({ open, onOpenChange }: PhoneNumbersModalProps) {
  const { t, language } = useLanguage();

  const { data: phoneNumbers, isLoading } = useQuery({
    queryKey: ['brand-phone-numbers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('brand_phone_numbers')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as PhoneNumber[];
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black flex items-center gap-2">
            <Phone className="w-6 h-6" />
            {t("Soita meille", "Call us", "اتصل بنا", "Позвоните нам", "Ring oss")}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-3 mt-4">
            {phoneNumbers?.map((phone) => (
              <a
                key={phone.id}
                href={`tel:${phone.phone_number}`}
                className="flex items-center justify-between p-4 rounded-xl border-2 border-gray-200 dark:border-stone-700 hover:border-primary hover:bg-primary/5 transition-all group"
              >
                <div>
                  <div className="font-bold text-gray-900 dark:text-white">
                    {phone.brand_name}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {language === 'en' && phone.phone_label_en
                      ? phone.phone_label_en
                      : phone.phone_label}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-primary text-lg">
                    {phone.phone_number}
                  </span>
                  <Phone className="w-5 h-5 text-primary group-hover:animate-pulse" />
                </div>
              </a>
            ))}

            {(!phoneNumbers || phoneNumbers.length === 0) && (
              <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                {t(
                  "Ei puhelinnumeroita saatavilla",
                  "No phone numbers available",
                  "لا توجد أرقام هواتف متاحة",
                  "Нет доступных телефонных номеров",
                  "Inga telefonnummer tillgängliga"
                )}
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
