import { useState, useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ArrowLeft, Mail, Lock, User, AlertCircle, CheckCircle, Stethoscope, UserRound, Zap } from 'lucide-react';
import { z } from 'zod';
import { useToast } from '../hooks/use-toast';

// Modo teste - usa Edge Function dev-login para autenticação segura

// Ícone Apple (SVG inline seguindo guidelines Apple)
const AppleIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
  </svg>
);

// Ícone Google (SVG inline colorido oficial)
const GoogleIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

// Detectar se deve mostrar botão Apple (iOS, Safari em macOS)
const isApplePlatform = () => {
  const ua = navigator.userAgent.toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(ua);
  const isSafari = /safari/.test(ua) && !/chrome/.test(ua);
  const isMacOS = /macintosh/.test(ua);
  return isIOS || (isMacOS && isSafari);
};

// Detectar se está em ambiente de desenvolvimento (localhost ou preview)
// Usado para ocultar "Modo Teste" em produção (domínios custom ou *.lovable.app sem preview)
const isDevEnvironment = () => {
  const hostname = window.location.hostname;
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.includes('preview')
  );
};

const patientSchema = z.object({
  email: z.string().email('Email inválido').min(1, 'Email é obrigatório'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  firstName: z.string().min(1, 'Nome é obrigatório'),
});

const doctorSchema = z.object({
  email: z.string().email('Email inválido').min(1, 'Email é obrigatório'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  firstName: z.string().min(1, 'Nome é obrigatório'),
  lastName: z.string().min(1, 'Sobrenome é obrigatório'),
  crm: z.string().min(1, 'CRM é obrigatório'),
  crm_uf: z.string().min(2, 'UF é obrigatória'),
  specialty: z.string().min(1, 'Especialidade é obrigatória'),
});

const loginSchema = z.object({
  email: z.string().email('Email inválido').min(1, 'Email é obrigatório'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

const BRAZILIAN_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

const SPECIALTIES = [
  'Oncologia Clínica',
  'Hematologia',
  'Oncologia Pediátrica',
  'Radioterapia',
  'Cirurgia Oncológica',
  'Mastologia',
  'Urologia Oncológica',
  'Ginecologia Oncológica',
  'Oncologia Torácica',
  'Neuro-oncologia',
  'Oncologia Gastrointestinal',
  'Outra'
];

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const [userType, setUserType] = useState<'patient' | 'doctor' | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    crm: '',
    crm_uf: '',
    specialty: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  // Reset userType when switching to login tab
  useEffect(() => {
    if (activeTab === 'login') {
      setUserType(null);
    }
  }, [activeTab]);

  const validateForm = (type: 'login' | 'patient' | 'doctor') => {
    try {
      let schema;
      if (type === 'login') {
        schema = loginSchema;
      } else if (type === 'patient') {
        schema = patientSchema;
      } else {
        schema = doctorSchema;
      }
      
      schema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.issues.forEach((issue) => {
          if (issue.path[0]) {
            newErrors[issue.path[0] as string] = issue.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSignUp = async () => {
    if (!userType) return;
    if (!validateForm(userType)) return;
    
    setIsLoading(true);
    setMessage(null);

    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            first_name: formData.firstName
          }
        }
      });

      if (error) {
        if (error.message.includes('User already registered')) {
          setMessage({
            type: 'error',
            text: 'Este email já está cadastrado. Tente fazer login.'
          });
        } else {
          setMessage({
            type: 'error',
            text: error.message
          });
        }
        return;
      }

      // If doctor, use edge function to create profile (bypasses RLS)
      if (userType === 'doctor' && data.user) {
        const { error: profileError } = await supabase.functions.invoke('register-doctor', {
          body: {
            user_id: data.user.id,
            first_name: formData.firstName,
            last_name: formData.lastName,
            crm: formData.crm,
            crm_uf: formData.crm_uf,
            specialty: formData.specialty
          }
        });

        if (profileError) {
          console.error('Error creating doctor profile:', profileError);
          setMessage({
            type: 'error',
            text: 'Conta criada, mas houve erro ao salvar dados profissionais. Entre em contato com suporte.'
          });
          return;
        }

        toast({
          title: "Cadastro realizado!",
          description: "Verifique seu email para confirmar sua conta.",
        });

        setMessage({
          type: 'success',
          text: 'Cadastro realizado! Verifique seu email para confirmar sua conta e fazer login.'
        });
        return;
      } else {
        toast({
          title: "Conta criada!",
          description: "Verifique seu email para confirmar sua conta.",
        });

        setMessage({
          type: 'success',
          text: 'Conta criada com sucesso! Verifique seu email para confirmar.'
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Erro inesperado. Tente novamente.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async () => {
    if (!validateForm('login')) return;
    
    setIsLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setMessage({
            type: 'error',
            text: 'Email ou senha incorretos.'
          });
        } else {
          setMessage({
            type: 'error',
            text: error.message
          });
        }
      } else {
        toast({
          title: "Login realizado!",
          description: "Bem-vindo de volta!",
        });
        navigate('/');
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Erro inesperado. Tente novamente.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      crm: '',
      crm_uf: '',
      specialty: ''
    });
    setErrors({});
    setMessage(null);
  };

  const handleBackToSelection = () => {
    setUserType(null);
    resetForm();
  };

  // Quick login via Edge Function (dev-login) - sem senha fixa
  const handleQuickLogin = async (type: 'patient' | 'doctor') => {
    setIsLoading(true);
    setMessage(null);
    
    try {
      console.log(`[Quick Login] Invoking dev-login for role: ${type}`);
      
      const { data, error } = await supabase.functions.invoke('dev-login', {
        body: { role: type }
      });

      if (error) {
        console.error('[Quick Login] Function error:', error);
        throw error;
      }

      if (data?.access_token && data?.refresh_token) {
        console.log('[Quick Login] Session received, setting...');
        
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: data.access_token,
          refresh_token: data.refresh_token
        });

        if (sessionError) {
          console.error('[Quick Login] Session error:', sessionError);
          throw sessionError;
        }

        toast({
          title: "Login de teste!",
          description: type === 'doctor' ? "Entrando como médico..." : "Entrando como paciente...",
        });
        
        navigate(type === 'doctor' ? '/doctor' : '/');
      } else {
        throw new Error(data?.error || 'Falha no login de teste');
      }
    } catch (error: any) {
      console.error('[Quick Login] Error:', error);
      setMessage({
        type: 'error',
        text: error.message || 'Erro no login de teste. Verifique se ENABLE_DEV_LOGIN está configurado.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Login social com Google
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setMessage(null);
    
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      
      if (error) throw error;
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || 'Erro ao conectar com Google'
      });
      setIsLoading(false);
    }
  };

  // Login social com Apple
  const handleAppleSignIn = async () => {
    setIsLoading(true);
    setMessage(null);
    
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: redirectUrl,
        },
      });
      
      if (error) throw error;
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || 'Erro ao conectar com Apple'
      });
      setIsLoading(false);
    }
  };

  if (user) {
    return null;
  }

  const renderUserTypeSelection = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-center text-foreground mb-6">
        Quem é você?
      </h3>
      
      <button
        onClick={() => setUserType('patient')}
        className="w-full p-4 border-2 border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-all text-left group"
      >
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
            <UserRound className="h-6 w-6" />
          </div>
          <div>
            <p className="font-semibold text-foreground">Sou Paciente</p>
            <p className="text-sm text-muted-foreground">Acompanhe seu tratamento</p>
          </div>
        </div>
      </button>

      <button
        onClick={() => setUserType('doctor')}
        className="w-full p-4 border-2 border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-all text-left group"
      >
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
            <Stethoscope className="h-6 w-6" />
          </div>
          <div>
            <p className="font-semibold text-foreground">Sou Profissional de Saúde</p>
            <p className="text-sm text-muted-foreground">Monitore seus pacientes</p>
          </div>
        </div>
      </button>
    </div>
  );

  const renderPatientForm = () => (
    <div className="space-y-4">
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={handleBackToSelection}
        className="mb-2 -ml-2"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Voltar
      </Button>

      <h3 className="text-lg font-medium text-foreground">
        Cadastro de Paciente
      </h3>

      <div className="space-y-2">
        <Label htmlFor="firstName">Nome</Label>
        <div className="relative">
          <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="firstName"
            type="text"
            placeholder="Seu nome"
            value={formData.firstName}
            onChange={(e) => handleInputChange('firstName', e.target.value)}
            className="pl-10"
            disabled={isLoading}
          />
        </div>
        {errors.firstName && (
          <p className="text-sm text-destructive">{errors.firstName}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-email">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="signup-email"
            type="email"
            placeholder="seu@email.com"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className="pl-10"
            disabled={isLoading}
          />
        </div>
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-password">Senha</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="signup-password"
            type="password"
            placeholder="Mínimo 6 caracteres"
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            className="pl-10"
            disabled={isLoading}
          />
        </div>
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password}</p>
        )}
      </div>

      <Button 
        onClick={handleSignUp} 
        disabled={isLoading}
        className="w-full"
      >
        {isLoading ? 'Criando conta...' : 'Criar Conta'}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        Ao criar uma conta, você concorda com nossos{' '}
        <a href="/terms-of-use" className="text-primary underline hover:text-primary/80">Termos de Uso</a>
        {' '}e{' '}
        <a href="/privacy-policy" className="text-primary underline hover:text-primary/80">Política de Privacidade</a>
      </p>
    </div>
  );

  const renderDoctorForm = () => (
    <div className="space-y-4">
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={handleBackToSelection}
        className="mb-2 -ml-2"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Voltar
      </Button>

      <h3 className="text-lg font-medium text-foreground">
        Cadastro de Profissional
      </h3>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="firstName">Nome</Label>
          <Input
            id="firstName"
            type="text"
            placeholder="Nome"
            value={formData.firstName}
            onChange={(e) => handleInputChange('firstName', e.target.value)}
            disabled={isLoading}
          />
          {errors.firstName && (
            <p className="text-sm text-destructive">{errors.firstName}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastName">Sobrenome</Label>
          <Input
            id="lastName"
            type="text"
            placeholder="Sobrenome"
            value={formData.lastName}
            onChange={(e) => handleInputChange('lastName', e.target.value)}
            disabled={isLoading}
          />
          {errors.lastName && (
            <p className="text-sm text-destructive">{errors.lastName}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="doctor-email">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="doctor-email"
            type="email"
            placeholder="seu@email.com"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className="pl-10"
            disabled={isLoading}
          />
        </div>
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="doctor-password">Senha</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="doctor-password"
            type="password"
            placeholder="Mínimo 6 caracteres"
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            className="pl-10"
            disabled={isLoading}
          />
        </div>
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="crm">CRM</Label>
          <Input
            id="crm"
            type="text"
            placeholder="123456"
            value={formData.crm}
            onChange={(e) => handleInputChange('crm', e.target.value)}
            disabled={isLoading}
          />
          {errors.crm && (
            <p className="text-sm text-destructive">{errors.crm}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="crm_uf">UF</Label>
          <Select
            value={formData.crm_uf}
            onValueChange={(value) => handleInputChange('crm_uf', value)}
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="UF" />
            </SelectTrigger>
            <SelectContent>
              {BRAZILIAN_STATES.map((state) => (
                <SelectItem key={state} value={state}>
                  {state}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.crm_uf && (
            <p className="text-sm text-destructive">{errors.crm_uf}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="specialty">Especialidade</Label>
        <Select
          value={formData.specialty}
          onValueChange={(value) => handleInputChange('specialty', value)}
          disabled={isLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione sua especialidade" />
          </SelectTrigger>
          <SelectContent>
            {SPECIALTIES.map((specialty) => (
              <SelectItem key={specialty} value={specialty}>
                {specialty}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.specialty && (
          <p className="text-sm text-destructive">{errors.specialty}</p>
        )}
      </div>

      <Button 
        onClick={handleSignUp} 
        disabled={isLoading}
        className="w-full"
      >
        {isLoading ? 'Cadastrando...' : 'Cadastrar'}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        Ao criar uma conta, você concorda com nossos termos de serviço
      </p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">
            Bem-vindo
          </h1>
          <p className="text-muted-foreground">
            Entre na sua conta ou crie uma nova
          </p>
        </div>

        {message && (
          <Alert className={message.type === 'error' ? 'border-destructive' : 'border-green-500'}>
            {message.type === 'error' ? (
              <AlertCircle className="h-4 w-4" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        <Card className="shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Autenticação</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Entrar</TabsTrigger>
                <TabsTrigger value="signup">Criar Conta</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="space-y-4 mt-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="pl-10"
                      disabled={isLoading}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Sua senha"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className="pl-10"
                      disabled={isLoading}
                    />
                  </div>
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password}</p>
                  )}
                </div>

                <Button 
                  onClick={handleSignIn} 
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? 'Entrando...' : 'Entrar'}
                </Button>

                {/* Divisor para login social */}
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">
                      ou continue com
                    </span>
                  </div>
                </div>

                {/* Botões de login social */}
                <div className="space-y-2">
                  {isApplePlatform() && (
                    <Button
                      variant="outline"
                      onClick={handleAppleSignIn}
                      disabled={isLoading}
                      className="w-full bg-black text-white hover:bg-gray-900 border-0"
                    >
                      <AppleIcon className="h-5 w-5 mr-2" />
                      Sign in with Apple
                    </Button>
                  )}
                  
                  <Button
                    variant="outline"
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                    className="w-full"
                  >
                    <GoogleIcon className="h-5 w-5 mr-2" />
                    Entrar com Google
                  </Button>
                </div>

                {/* Modo Teste - Apenas em ambiente de desenvolvimento */}
                {isDevEnvironment() && (
                  <div className="mt-6 pt-4 border-t border-border">
                    <div className="flex items-center gap-2 mb-3">
                      <Zap className="h-4 w-4 text-amber-500" />
                      <span className="text-sm font-medium text-muted-foreground">Modo Teste</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        variant="outline"
                        onClick={() => handleQuickLogin('patient')}
                        disabled={isLoading}
                        className="border-primary/30 hover:bg-primary/10"
                      >
                        <UserRound className="h-4 w-4 mr-2" />
                        Paciente
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => handleQuickLogin('doctor')}
                        disabled={isLoading}
                        className="border-primary/30 hover:bg-primary/10"
                      >
                        <Stethoscope className="h-4 w-4 mr-2" />
                        Médico
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground text-center mt-2">
                      Acesso rápido para desenvolvimento
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="signup" className="mt-6">
                {userType === null && renderUserTypeSelection()}
                {userType === 'patient' && renderPatientForm()}
                {userType === 'doctor' && renderDoctorForm()}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          Precisa de ajuda? Entre em contato conosco.
        </p>
      </div>
    </div>
  );
}
