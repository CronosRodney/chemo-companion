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

                {/* Modo Teste - Acesso Rápido */}
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
