import { useCustomerAuth } from '@/hooks/use-customer-auth';
import { useLoyaltyRewards, useLoyaltyTransactions, useRedeemReward } from '@/hooks/use-loyalty';
import { useLanguage } from '@/lib/language-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UniversalHeader } from '@/components/universal-header';
import { Award, TrendingUp, TrendingDown, Gift, Clock, Check, Lock } from 'lucide-react';
import { useLocation } from 'wouter';
import { useState } from 'react';

export default function Loyalty() {
  const [, setLocation] = useLocation();
  const { customer, isAuthenticated, loading: authLoading } = useCustomerAuth();
  const { data: rewards, isLoading: rewardsLoading } = useLoyaltyRewards();
  const { data: transactions } = useLoyaltyTransactions(customer?.id || '');
  const redeemMutation = useRedeemReward();
  const { t } = useLanguage();

  const [selectedReward, setSelectedReward] = useState<string | null>(null);

  if (!authLoading && !isAuthenticated) {
    setLocation('/auth/login');
    return null;
  }

  if (authLoading || !customer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50 dark:from-stone-900 dark:via-stone-800 dark:to-stone-900">
        <UniversalHeader />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  const handleRedeem = async (rewardId: string) => {
    try {
      setSelectedReward(rewardId);
      await redeemMutation.mutateAsync({
        customerId: customer.id,
        rewardId,
        currentPoints: customer.loyalty_points,
      });
    } catch (error: any) {
      alert(error.message);
    } finally {
      setSelectedReward(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50 dark:from-stone-900 dark:via-stone-800 dark:to-stone-900">
      <UniversalHeader />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-2">
            {t('Kanta-asiakasohjelma', 'Loyalty Program', 'برنامج الولاء', 'Программа лояльности', 'Lojalitetsprogram')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('Ansaitse pisteitä ja lunasta palkintoja', 'Earn points and redeem rewards', 'اكسب نقاطًا واسترد المكافآت', 'Зарабатывайте баллы и получайте награды', 'Tjäna poäng och lös in belöningar')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Points Balance */}
          <div className="lg:col-span-1">
            <Card className="bg-gradient-to-br from-yellow-500 to-orange-500 text-white border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Award className="w-6 h-6" />
                  {t('Pisteesi', 'Your Points', 'نقاطك', 'Ваши баллы', 'Dina poäng')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-6xl font-black mb-2">{customer.loyalty_points}</div>
                  <p className="text-yellow-100">
                    {t('Pistettä käytettävissä', 'Points available', 'نقاط متاحة', 'Доступно баллов', 'Poäng tillgängliga')}
                  </p>
                </div>

                <div className="mt-6 p-4 bg-white/20 rounded-xl backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm">{t('Yhteensä tilattu', 'Total spent', 'إجمالي الإنفاق', 'Всего потрачено', 'Totalt spenderat')}</span>
                    <span className="font-bold">€{customer.total_spent.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{t('Tilauksia', 'Orders', 'الطلبات', 'Заказов', 'Beställningar')}</span>
                    <span className="font-bold">{customer.total_orders}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* How it works */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">{t('Kuinka se toimii', 'How it works', 'كيف يعمل', 'Как это работает', 'Hur det fungerar')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">
                    {t('Ansaitse 1 piste per käytetty euro', 'Earn 1 point per euro spent', 'اكسب نقطة واحدة لكل يورو يتم إنفاقه', 'Зарабатывайте 1 балл за каждый потраченный евро', 'Tjäna 1 poäng per spenderad euro')}
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">
                    {t('Bonuspisteitä noudosta +50%', 'Bonus points for pickup +50%', 'نقاط إضافية للاستلام +50%', 'Бонусные баллы за самовывоз +50%', 'Bonuspoäng för avhämtning +50%')}
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center flex-shrink-0">
                    <Gift className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">
                    {t('Lunasta palkintoja pisteillä', 'Redeem rewards with points', 'استرد المكافآت بالنقاط', 'Обменивайте баллы на награды', 'Lös in belöningar med poäng')}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Rewards & Transactions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Available Rewards */}
            <Card>
              <CardHeader>
                <CardTitle>{t('Saatavilla olevat palkinnot', 'Available Rewards', 'المكافآت المتاحة', 'Доступные награды', 'Tillgängliga belöningar')}</CardTitle>
                <CardDescription>
                  {t('Lunasta palkintoja pisteillä', 'Redeem rewards with your points', 'استرد المكافآت بنقاطك', 'Обменяйте баллы на награды', 'Lös in belöningar med dina poäng')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {rewardsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  </div>
                ) : rewards && rewards.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {rewards.map((reward) => {
                      const canAfford = customer.loyalty_points >= reward.points_required;
                      const isRedeeming = selectedReward === reward.id;

                      return (
                        <Card key={reward.id} className={`${canAfford ? 'border-2 border-green-500 dark:border-green-600' : 'opacity-60'}`}>
                          <CardContent className="pt-6">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <h3 className="font-bold text-lg mb-1">{reward.name}</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{reward.description}</p>
                              </div>
                              <Badge variant={canAfford ? 'default' : 'secondary'} className="flex-shrink-0">
                                {reward.points_required} {t('pts', 'pts', 'نقاط', 'баллов', 'p')}
                              </Badge>
                            </div>

                            {reward.min_order_amount > 0 && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                                {t('Min. tilaus', 'Min. order', 'الحد الأدنى للطلب', 'Мин. заказ', 'Min. beställning')}: €{reward.min_order_amount}
                              </p>
                            )}

                            <Button
                              className="w-full"
                              disabled={!canAfford || isRedeeming}
                              onClick={() => handleRedeem(reward.id)}
                            >
                              {isRedeeming ? (
                                <>{t('Lunastetaan...', 'Redeeming...', 'جاري الاسترداد...', 'Обмен...', 'Löser in...')}</>
                              ) : canAfford ? (
                                <><Gift className="w-4 h-4 mr-2" /> {t('Lunasta', 'Redeem', 'استرد', 'Обменять', 'Lös in')}</>
                              ) : (
                                <><Lock className="w-4 h-4 mr-2" /> {reward.points_required - customer.loyalty_points} {t('pistettä puuttuu', 'points needed', 'نقاط مطلوبة', 'баллов нужно', 'poäng behövs')}</>
                              )}
                            </Button>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Gift className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>{t('Ei palkintoja saatavilla', 'No rewards available', 'لا توجد مكافآت متاحة', 'Нет доступных наград', 'Inga belöningar tillgängliga')}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Transaction History */}
            <Card>
              <CardHeader>
                <CardTitle>{t('Pistehistoria', 'Points History', 'سجل النقاط', 'История баллов', 'Poänghistorik')}</CardTitle>
              </CardHeader>
              <CardContent>
                {transactions && transactions.length > 0 ? (
                  <div className="space-y-3">
                    {transactions.slice(0, 10).map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-stone-900 rounded-lg">
                        <div className="flex items-center gap-3">
                          {transaction.transaction_type === 'earned' ? (
                            <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                          ) : (
                            <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
                          )}
                          <div>
                            <p className="font-medium text-sm">
                              {transaction.description || transaction.transaction_type}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(transaction.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${transaction.points > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {transaction.points > 0 ? '+' : ''}{transaction.points}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {t('Saldo', 'Balance', 'الرصيد', 'Баланс', 'Saldo')}: {transaction.balance_after}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>{t('Ei tapahtumahistoriaa', 'No transaction history', 'لا يوجد سجل معاملات', 'Нет истории транзакций', 'Ingen transaktionshistorik')}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
