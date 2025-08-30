import React, { useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
} from 'react-native';
import { COLORS, SHADOWS } from '@/constants/colors';
import Button from '@/components/Button';
import { X, CreditCard, Smartphone, Wallet } from 'lucide-react-native';

interface PaymentModalProps {
  visible: boolean;
  onClose: () => void;
  onPaymentSuccess: (paymentMethod: string) => void;
  total: number;
}

type Stage = 'method' | 'cardDetails' | 'processing';
type PaymentMethod = {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
};

const PaymentModal: React.FC<PaymentModalProps> = ({
  visible,
  onClose,
  onPaymentSuccess,
  total,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [processing, setProcessing] = useState(false);
  const [stage, setStage] = useState<Stage>('method');

  const [cardName, setCardName] = useState<string>('');
  const [cardNumber, setCardNumber] = useState<string>('');
  const [expiry, setExpiry] = useState<string>('');
  const [cvc, setCvc] = useState<string>('');
  const [errors, setErrors] = useState<{ name?: string; number?: string; expiry?: string; cvc?: string }>({});
  const maskedNumber = useMemo(() => cardNumber.replace(/\s+/g, '').replace(/(\d{4})(?=\d)/g, '$1 ').trim(), [cardNumber]);

  const paymentMethods: PaymentMethod[] = [
    {
      id: 'card',
      name: 'Credit/Debit Card',
      icon: <CreditCard size={24} color={COLORS.maleAccent} />,
      description: 'Pay with your credit or debit card',
    },
    {
      id: 'apple_pay',
      name: 'Apple Pay',
      icon: <Smartphone size={24} color={COLORS.maleAccent} />,
      description: 'Quick and secure payment with Apple Pay',
    },
    {
      id: 'google_pay',
      name: 'Google Pay',
      icon: <Wallet size={24} color={COLORS.maleAccent} />,
      description: 'Pay with Google Pay',
    },
  ];

  const validateCard = () => {
    const newErrors: { name?: string; number?: string; expiry?: string; cvc?: string } = {};
    if (!cardName.trim()) newErrors.name = 'Nom du titulaire requis';

    const digits = cardNumber.replace(/\s+/g, '');
    const luhn = (num: string) => {
      let sum = 0;
      let alt = false;
      for (let i = num.length - 1; i >= 0; i--) {
        let n = parseInt(num[i] ?? '0', 10);
        if (alt) {
          n *= 2;
          if (n > 9) n -= 9;
        }
        sum += n;
        alt = !alt;
      }
      return sum % 10 === 0;
    };
    if (digits.length < 13 || digits.length > 19 || !luhn(digits)) newErrors.number = 'Numéro de carte invalide';

    const expMatch = expiry.match(/^(0[1-9]|1[0-2])\/(\d{2})$/);
    if (!expMatch) newErrors.expiry = "Date d'expiration invalide (MM/YY)";
    else {
      const month = parseInt(expMatch[1] ?? '0', 10);
      const year = 2000 + parseInt(expMatch[2] ?? '0', 10);
      const now = new Date();
      const expDate = new Date(year, month - 1, 1);
      expDate.setMonth(expDate.getMonth() + 1);
      if (expDate <= now) newErrors.expiry = 'Carte expirée';
    }

    if (!/^\d{3,4}$/.test(cvc)) newErrors.cvc = 'CVC invalide';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePayment = async () => {
    if (!selectedMethod) {
      Alert.alert('Payment Method Required', 'Please select a payment method to continue.');
      return;
    }

    if (selectedMethod === 'card' && stage === 'method') {
      setStage('cardDetails');
      return;
    }

    if (selectedMethod === 'card' && stage === 'cardDetails') {
      if (!validateCard()) return;
    }

    setProcessing(true);
    setStage('processing');

    setTimeout(() => {
      setProcessing(false);
      const method = paymentMethods.find(m => m.id === selectedMethod);
      onPaymentSuccess(method?.name || selectedMethod);
      setStage('method');
      setSelectedMethod('');
      setCardName('');
      setCardNumber('');
      setExpiry('');
      setCvc('');
      setErrors({});
    }, 1800);
  };

  const handleClose = () => {
    if (!processing) {
      setSelectedMethod('');
      setStage('method');
      setCardName('');
      setCardNumber('');
      setExpiry('');
      setCvc('');
      setErrors({});
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Payment</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
            disabled={processing}
          >
            <X size={24} color={COLORS.darkGray} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.summaryContainer}>
            <Text style={styles.summaryTitle}>Order Summary</Text>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalAmount}>${total.toFixed(2)}</Text>
            </View>
          </View>

          {stage === 'method' && (
            <View style={styles.paymentMethodsContainer}>
              <Text style={styles.sectionTitle}>Select Payment Method</Text>
              {paymentMethods.map((method) => (
                <TouchableOpacity
                  key={method.id}
                  style={[
                    styles.paymentMethod,
                    selectedMethod === method.id && styles.selectedPaymentMethod,
                  ]}
                  onPress={() => setSelectedMethod(method.id)}
                  disabled={processing}
                  testID={`payment-method-${method.id}`}
                >
                  <View style={styles.methodIcon}>
                    {method.icon}
                  </View>
                  <View style={styles.methodInfo}>
                    <Text style={styles.methodName}>{method.name}</Text>
                    <Text style={styles.methodDescription}>{method.description}</Text>
                  </View>
                  <View style={[
                    styles.radioButton,
                    selectedMethod === method.id && styles.selectedRadioButton,
                  ]} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {selectedMethod === 'card' && stage === 'cardDetails' && (
            <View style={styles.cardForm}>
              <Text style={styles.sectionTitle}>Card details</Text>

              <View style={styles.inputGroupRow}>
                <Text style={styles.label}>Name on card</Text>
                <TextInput
                  style={[styles.input, errors.name && styles.inputError]}
                  value={cardName}
                  onChangeText={setCardName}
                  placeholder="Jane Appleseed"
                  placeholderTextColor={COLORS.darkGray}
                  autoCapitalize="words"
                  testID="card-name"
                />
                {!!errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
              </View>

              <View style={styles.inputGroupRow}>
                <Text style={styles.label}>Card number</Text>
                <TextInput
                  style={[styles.input, errors.number && styles.inputError]}
                  value={maskedNumber}
                  onChangeText={(txt) => setCardNumber(txt.replace(/[^\d]/g, ''))}
                  keyboardType="numeric"
                  placeholder="1234 5678 9012 3456"
                  placeholderTextColor={COLORS.darkGray}
                  maxLength={19 + 3}
                  testID="card-number"
                />
                {!!errors.number && <Text style={styles.errorText}>{errors.number}</Text>}
              </View>

              <View style={styles.row2}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Expiry (MM/YY)</Text>
                  <TextInput
                    style={[styles.input, errors.expiry && styles.inputError]}
                    value={expiry}
                    onChangeText={(txt) => {
                      const clean = txt.replace(/[^\d]/g, '').slice(0, 4);
                      const mm = clean.slice(0, 2);
                      const yy = clean.slice(2, 4);
                      const formatted = yy ? `${mm}/${yy}` : mm;
                      setExpiry(formatted);
                    }}
                    keyboardType="numeric"
                    placeholder="MM/YY"
                    placeholderTextColor={COLORS.darkGray}
                    maxLength={5}
                    testID="card-expiry"
                  />
                  {!!errors.expiry && <Text style={styles.errorText}>{errors.expiry}</Text>}
                </View>
                <View style={{ width: 12 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>CVC</Text>
                  <TextInput
                    style={[styles.input, errors.cvc && styles.inputError]}
                    value={cvc}
                    onChangeText={(txt) => setCvc(txt.replace(/[^\d]/g, '').slice(0, 4))}
                    keyboardType="numeric"
                    placeholder="123"
                    placeholderTextColor={COLORS.darkGray}
                    maxLength={4}
                    testID="card-cvc"
                  />
                  {!!errors.cvc && <Text style={styles.errorText}>{errors.cvc}</Text>}
                </View>
              </View>

              <TouchableOpacity onPress={() => setStage('method')} style={styles.linkBtn}>
                <Text style={styles.linkText}>Change payment method</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <Button
            title={
              stage === 'method'
                ? (processing ? 'Processing...' : (selectedMethod === 'card' ? 'Continue' : `Pay ${total.toFixed(2)}`))
                : stage === 'cardDetails'
                ? 'Pay'
                : 'Processing...'
            }
            onPress={handlePayment}
            loading={processing || stage === 'processing'}
            disabled={!selectedMethod}
            style={styles.payButton}
            testID="pay-continue"
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.mediumGray,
  },
  title: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: COLORS.black,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  summaryContainer: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    marginBottom: 24,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.black,
    marginBottom: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    color: COLORS.darkGray,
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: COLORS.maleAccent,
  },
  paymentMethodsContainer: {
    marginBottom: 24,
  },
  cardForm: {
    marginTop: 8,
  },
  inputGroupRow: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginBottom: 6,
  },
  input: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.mediumGray,
    color: COLORS.black,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  errorText: {
    marginTop: 6,
    color: COLORS.error,
    fontSize: 12,
  },
  row2: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  linkBtn: {
    marginTop: 8,
  },
  linkText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: COLORS.black,
    marginBottom: 16,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: COLORS.mediumGray,
    ...SHADOWS.small,
  },
  selectedPaymentMethod: {
    borderColor: COLORS.maleAccent,
    backgroundColor: COLORS.lightGray,
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  methodInfo: {
    flex: 1,
  },
  methodName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.black,
    marginBottom: 4,
  },
  methodDescription: {
    fontSize: 14,
    color: COLORS.darkGray,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.mediumGray,
    backgroundColor: COLORS.white,
  },
  selectedRadioButton: {
    borderColor: COLORS.maleAccent,
    backgroundColor: COLORS.maleAccent,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: COLORS.mediumGray,
    ...SHADOWS.large,
  },
  payButton: {
    marginTop: 8,
  },
});

export default PaymentModal;