import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

enum AppLanguage { portuguese, english, spanish }

extension AppLanguageInfo on AppLanguage {
  String get code {
    return switch (this) {
      AppLanguage.portuguese => 'pt',
      AppLanguage.english => 'en',
      AppLanguage.spanish => 'es',
    };
  }

  Locale get locale {
    return Locale(code);
  }

  String get flag {
    return switch (this) {
      AppLanguage.portuguese => '🇵🇹',
      AppLanguage.english => '🇬🇧',
      AppLanguage.spanish => '🇪🇸',
    };
  }
}

AppLanguage appLanguageFromCode(String? code) {
  return switch (code) {
    'en' => AppLanguage.english,
    'es' => AppLanguage.spanish,
    _ => AppLanguage.portuguese,
  };
}

class AppLanguageController extends ChangeNotifier {
  AppLanguageController({AppLanguage initialLanguage = AppLanguage.portuguese})
    : _language = initialLanguage;

  static final AppLanguageController instance = AppLanguageController();
  static const String _storageKey = 'softinsa_language_code';

  AppLanguage _language;

  AppLanguage get language => _language;
  Locale get locale => _language.locale;

  Future<void> load() async {
    final preferences = await SharedPreferences.getInstance();
    _language = appLanguageFromCode(preferences.getString(_storageKey));
  }

  Future<void> setLanguage(AppLanguage language) async {
    if (_language == language) {
      return;
    }

    _language = language;
    notifyListeners();

    final preferences = await SharedPreferences.getInstance();
    await preferences.setString(_storageKey, language.code);
  }
}

class AppLanguageScope extends InheritedNotifier<AppLanguageController> {
  const AppLanguageScope({
    super.key,
    required AppLanguageController controller,
    required super.child,
  }) : super(notifier: controller);

  static AppLanguageController of(BuildContext context) {
    final scope = context
        .dependOnInheritedWidgetOfExactType<AppLanguageScope>();
    assert(scope != null, 'AppLanguageScope not found in widget tree.');
    return scope!.notifier!;
  }
}

class AppStrings {
  const AppStrings(this.language);

  final AppLanguage language;

  static AppStrings of(BuildContext context) {
    return AppStrings(AppLanguageScope.of(context).language);
  }

  String get appTitle => 'Softinsa Badges';
  String get navHome => _value('navHome');
  String get navCatalog => _value('navCatalog');
  String get navMyBadges => _value('navMyBadges');
  String get navRanking => 'Ranking';
  String get navProfile => _value('navProfile');
  String get profileTitle => _value('profileTitle');
  String get profileSubtitle => _value('profileSubtitle');
  String get consultant => _value('consultant');
  String get totalPoints => _value('totalPoints');
  String get earnedBadges => _value('earnedBadges');
  String get account => _value('account');
  String get email => 'Email';
  String get area => _value('area');
  String get noLocalEmail => _value('noLocalEmail');
  String get noLocalArea => _value('noLocalArea');
  String get consultantsDirectory => _value('consultantsDirectory');
  String get configureSignature => _value('configureSignature');
  String get changePassword => _value('changePassword');
  String get languageTitle => _value('language');
  String get privacyTitle => _value('privacyTitle');
  String get privacyBody => _value('privacyBody');
  String get rgpdInfo => _value('rgpdInfo');
  String get rgpdBody => _value('rgpdBody');
  String get logout => _value('logout');

  String translate(String source) {
    if (language == AppLanguage.portuguese || source.isEmpty) {
      return source;
    }

    final translated = _uiTranslations[language.code]?[source];
    if (translated != null) {
      return translated;
    }

    return _translateDynamic(source);
  }

  String _translateDynamic(String source) {
    final replacements = language == AppLanguage.english
        ? const <String, String>{
            ' badges sincronizados': ' synced badges',
            ' consultores': ' consultants',
            ' conquistas': ' achievements',
            ' novas': ' new',
            ' pontos': ' points',
            ' selecionados': ' selected',
            '\nselecionados': '\nselected',
          }
        : const <String, String>{
            ' badges sincronizados': ' badges sincronizados',
            ' consultores': ' consultores',
            ' conquistas': ' logros',
            ' novas': ' nuevas',
            ' pontos': ' puntos',
            ' selecionados': ' seleccionados',
            '\nselecionados': '\nseleccionados',
          };

    for (final replacement in replacements.entries) {
      if (source.endsWith(replacement.key)) {
        return '${source.substring(0, source.length - replacement.key.length)}${replacement.value}';
      }
    }

    if (source.startsWith('Desde ')) {
      return '${language == AppLanguage.english ? 'Since' : 'Desde'} ${source.substring(6)}';
    }
    if (source.startsWith('Desbloqueado em ')) {
      final prefix = language == AppLanguage.english
          ? 'Unlocked on'
          : 'Desbloqueado el';
      return '$prefix ${source.substring(16)}';
    }
    if (source.startsWith('Desbloqueada em ')) {
      final prefix = language == AppLanguage.english
          ? 'Unlocked on'
          : 'Desbloqueada el';
      return '$prefix ${source.substring(16)}';
    }
    if (source.startsWith('Versão ')) {
      final prefix = language == AppLanguage.english ? 'Version' : 'Versión';
      return '$prefix ${source.substring(7)}';
    }
    final confirmationEmail = RegExp(
      r'^Enviámos um link de confirmação para (.+)\. Abra o link antes de iniciar sessão\.$',
    ).firstMatch(source);
    if (confirmationEmail != null) {
      final email = confirmationEmail.group(1)!;
      return language == AppLanguage.english
          ? 'We sent a confirmation link to $email. Open it before signing in.'
          : 'Hemos enviado un enlace de confirmación a $email. Ábrelo antes de iniciar sesión.';
    }
    final milestone = RegExp(
      r'^Parabéns por conquistar (\d+) badges?\. Continue a evoluir!$',
    ).firstMatch(source);
    if (milestone != null) {
      final count = milestone.group(1)!;
      return language == AppLanguage.english
          ? 'Congratulations on earning $count badge${count == '1' ? '' : 's'}. Keep growing!'
          : '¡Enhorabuena por conseguir $count badge${count == '1' ? '' : 's'}. Sigue avanzando!';
    }
    final expiredBadges = RegExp(
      r'^(\d+) badge\(s\) expirada\(s\) e (\d+) próxima\(s\) da renovação\.$',
    ).firstMatch(source);
    if (expiredBadges != null) {
      return language == AppLanguage.english
          ? '${expiredBadges.group(1)} expired badge(s) and ${expiredBadges.group(2)} nearing renewal.'
          : '${expiredBadges.group(1)} badge(s) caducado(s) y ${expiredBadges.group(2)} próximo(s) a renovarse.';
    }
    final expiringBadges = RegExp(
      r'^(\d+) badge\(s\) próxima\(s\) da data de expiração\.$',
    ).firstMatch(source);
    if (expiringBadges != null) {
      return language == AppLanguage.english
          ? '${expiringBadges.group(1)} badge(s) nearing expiration.'
          : '${expiringBadges.group(1)} badge(s) próximo(s) a caducar.';
    }
    if (source.startsWith('Um código de 4 dígitos foi enviado para:')) {
      final email = source.split('\n').skip(1).join('\n');
      final prefix = language == AppLanguage.english
          ? 'A 4-digit code was sent to:'
          : 'Se ha enviado un código de 4 dígitos a:';
      return '$prefix\n$email';
    }
    final approvedBadges = RegExp(
      r'^(\d+) badges aprovados no seu perfil\.$',
    ).firstMatch(source);
    if (approvedBadges != null) {
      final count = approvedBadges.group(1)!;
      return language == AppLanguage.english
          ? '$count approved badges on your profile.'
          : '$count badges aprobados en tu perfil.';
    }

    return source;
  }

  String languageName(AppLanguage option) {
    final key = switch (option) {
      AppLanguage.portuguese => 'portuguese',
      AppLanguage.english => 'english',
      AppLanguage.spanish => 'spanish',
    };
    return _value(key);
  }

  String _value(String key) {
    return _translations[language.code]?[key] ??
        _translations['pt']?[key] ??
        key;
  }

  static const Map<String, Map<String, String>> _translations = {
    'pt': {
      'navHome': 'Início',
      'navCatalog': 'Catálogo',
      'navMyBadges': 'Meus\nBadges',
      'navProfile': 'Perfil',
      'profileTitle': 'Perfil',
      'profileSubtitle': 'Gestão de conta e preferências',
      'consultant': 'Consultor',
      'totalPoints': 'Total Pontos',
      'earnedBadges': 'Badges Ganhos',
      'account': 'Conta',
      'area': 'Área',
      'noLocalEmail': 'Sem email local',
      'noLocalArea': 'Sem área local',
      'consultantsDirectory': 'Diretório de\nConsultores',
      'configureSignature': 'Configurar Assinatura',
      'changePassword': 'Alterar Password',
      'language': 'Idioma',
      'privacyTitle': 'Privacidade e RGPD',
      'privacyBody':
          'Aceito a partilha pública dos meus badges e conquistas no ranking da plataforma. Os dados pessoais são tratados de acordo com o RGPD.',
      'rgpdInfo': 'Informação RGPD',
      'rgpdBody':
          'A Softinsa compromete-se a proteger a sua privacidade. Os seus dados são utilizados apenas para fins de gestão de competências e desenvolvimento profissional.',
      'logout': 'Terminar Sessão',
      'portuguese': 'Português',
      'english': 'Inglês',
      'spanish': 'Espanhol',
    },
    'en': {
      'Bom dia,': 'Good morning,',
      'Boa tarde,': 'Good afternoon,',
      'Boa noite,': 'Good evening,',
      'Bem-vindo!': 'Welcome!',
      'Seja bem-vindo novamente': 'Welcome back',
      'Consultor': 'Consultant',
      'Consultora': 'Consultant',
      'Consultor Júnior': 'Junior Consultant',
      'Consultora Júnior': 'Junior Consultant',
      'Consultor Sénior': 'Senior Consultant',
      'Consultora Sénior': 'Senior Consultant',
      'Informações': 'Information',
      'O badge AWS Cloud Practitioner expira em 30 dias. Renove a sua certificação.':
          'The AWS Cloud Practitioner badge expires in 30 days. Renew your certification.',
      '3 novas conquistas desbloqueadas!': '3 new achievements unlocked!',
      'Próximo Nível do OutSystems que já completou':
          'Next OutSystems level after the one you completed',
      'Nível A': 'Level A',
      'Nível B': 'Level B',
      'Próximo Nível': 'Next Level',
      '2-3 meses': '2-3 months',
      '1-2 meses': '1-2 months',
      '3-4 meses': '3-4 months',
      'OutSystems Nível A completado': 'OutSystems Level A completed',
      'Recomendado para a sua Service Line: Hybrid Cloud':
          'Recommended for your Service Line: Hybrid Cloud',
      'Próximo passo após Azure Fundamentals':
          'Next step after Azure Fundamentals',
      'Azure Fundamentals completado': 'Azure Fundamentals completed',
      'Complementa as suas skills de cloud': 'Complements your cloud skills',
      'Informacoes': 'Information',
      'Dados sincronizados a partir da API.': 'Data synced from the API.',
      'O seu badge Nível Júnior - OutSystems foi aprovado!':
          'Your Junior Level - OutSystems badge was approved!',
      'O badge AWS Cloud Practitioner expira em 30 dias':
          'The AWS Cloud Practitioner badge expires in 30 days',
      'Feedback necessário para o badge Azure Fundamentals':
          'Feedback required for the Azure Fundamentals badge',
      'Primeiros 100 utilizadores da plataforma': 'First 100 platform users',
      '10+ badges conquistados': '10+ badges earned',
      'Badge Azure Fundamentals aprovado': 'Azure Fundamentals badge approved',
      'Candidatura em validação': 'Application under validation',
      'Badge aprovada': 'Badge approved',
      'Sessao expirada. Inicie sessao novamente.':
          'Session expired. Sign in again.',
      'navHome': 'Home',
      'navCatalog': 'Catalog',
      'navMyBadges': 'My\nBadges',
      'navProfile': 'Profile',
      'profileTitle': 'Profile',
      'profileSubtitle': 'Account and preferences management',
      'consultant': 'Consultant',
      'totalPoints': 'Total Points',
      'earnedBadges': 'Earned Badges',
      'account': 'Account',
      'area': 'Area',
      'noLocalEmail': 'No local email',
      'noLocalArea': 'No local area',
      'consultantsDirectory': 'Consultants\nDirectory',
      'configureSignature': 'Configure Signature',
      'changePassword': 'Change Password',
      'language': 'Language',
      'privacyTitle': 'Privacy and GDPR',
      'privacyBody':
          'I accept the public sharing of my badges and achievements in the platform ranking. Personal data is processed according to GDPR.',
      'rgpdInfo': 'GDPR Information',
      'rgpdBody':
          'Softinsa is committed to protecting your privacy. Your data is used only for skills management and professional development.',
      'logout': 'Sign Out',
      'portuguese': 'Portuguese',
      'english': 'English',
      'spanish': 'Spanish',
    },
    'es': {
      'navHome': 'Inicio',
      'navCatalog': 'Catálogo',
      'navMyBadges': 'Mis\nBadges',
      'navProfile': 'Perfil',
      'profileTitle': 'Perfil',
      'profileSubtitle': 'Gestión de cuenta y preferencias',
      'consultant': 'Consultor',
      'totalPoints': 'Puntos Totales',
      'earnedBadges': 'Badges Ganados',
      'account': 'Cuenta',
      'area': 'Área',
      'noLocalEmail': 'Sin email local',
      'noLocalArea': 'Sin área local',
      'consultantsDirectory': 'Directorio de\nConsultores',
      'configureSignature': 'Configurar Firma',
      'changePassword': 'Cambiar Contraseña',
      'language': 'Idioma',
      'privacyTitle': 'Privacidad y RGPD',
      'privacyBody':
          'Acepto compartir públicamente mis badges y logros en el ranking de la plataforma. Los datos personales se tratan de acuerdo con el RGPD.',
      'rgpdInfo': 'Información RGPD',
      'rgpdBody':
          'Softinsa se compromete a proteger tu privacidad. Tus datos se utilizan solo para la gestión de competencias y el desarrollo profesional.',
      'logout': 'Cerrar Sesión',
      'portuguese': 'Portugués',
      'english': 'Inglés',
      'spanish': 'Español',
    },
  };

  static const Map<String, Map<String, String>> _uiTranslations = {
    'en': {
      'Preencha todos os campos.': 'Fill in all fields.',
      'As palavras-passe não coincidem.': 'The passwords do not match.',
      'Aceite os termos para continuar.': 'Accept the terms to continue.',
      'Nao foi possivel comunicar com a API.': 'Could not connect to the API.',
      'Criar conta': 'Create account',
      'Crie uma conta para iniciar.': 'Create an account to get started.',
      'Nome': 'Name',
      'Endereço email': 'Email address',
      'Palavra-passe da empresa': 'Company password',
      'Nova palavra-passe': 'New password',
      'Criar palavra-passe': 'Create password',
      'Confirmar palavra-passe': 'Confirm password',
      'A criar conta...': 'Creating account...',
      'Continuar': 'Continue',
      "I've read and agree with the ": "I've read and agree with the ",
      'Terms and Conditions': 'Terms and Conditions',
      ' and the ': ' and the ',
      'Privacy Policy': 'Privacy Policy',
      'Preencha o email e a palavra-passe.': 'Enter your email and password.',
      'Entrar': 'Sign in',
      'Palavra-passe': 'Password',
      'Esqueceste-te da palavra-passe?': 'Forgot your password?',
      'Guardar dados login': 'Remember login details',
      'A entrar...': 'Signing in...',
      'Login': 'Sign in',
      'Não foi possível carregar os dados.': 'Could not load the data.',
      'Total de Pontos': 'Total Points',
      'Continue a evoluir no seu percurso técnico':
          'Keep progressing on your technical journey',
      'Recomendado para Si': 'Recommended for You',
      'Ver Todas': 'View All',
      'Sugestões Personalizadas': 'Personalized Suggestions',
      'Baseadas no seu progresso atual e na sua área: OutSystems':
          'Based on your current progress and area: OutSystems',
      'Ver detalhes do badge': 'View badge details',
      'Relacionado': 'Related',
      'Pré-requisitos:': 'Prerequisites:',
      'Explorar Mais Badges': 'Explore More Badges',
      'Badges ganhos': 'Badges earned',
      'Em progresso': 'In progress',
      'Insira o código de 4 dígitos.': 'Enter the 4-digit code.',
      'Código enviado novamente.': 'Code sent again.',
      'Insira o código de confirmação': 'Enter the confirmation code',
      'Enviar novamente': 'Send again',
      'Palavra-passe currentPassword == newPasswordsucesso.':
          'Password changed successfully.',
      'Palavra-Passe Atual': 'Current Password',
      'Insira a palavra-passe fornecida pela empresa':
          'Enter the password provided by the company',
      'Nova Palavra-Passe': 'New Password',
      'Insira a nova palavra-passe': 'Enter the new password',
      'Requisitos da palavra-passe:': 'Password requirements:',
      'Mínimo de 8 caracteres': 'At least 8 characters',
      'Pelo menos uma letra maiúscula': 'At least one uppercase letter',
      'Pelo menos uma letra minúscula': 'At least one lowercase letter',
      'Pelo menos um número': 'At least one number',
      'Pelo menos um caractere especial (!@#\$%^&*)':
          'At least one special character (!@#\$%^&*)',
      'Diferente da palavra-passe atual': 'Different from the current password',
      'Confirmar Nova Palavra-Passe': 'Confirm New Password',
      'Confirme a nova palavra-passe': 'Confirm the new password',
      'A alterar...': 'Changing...',
      'Alterar Palavra-Passe': 'Change Password',
      'Depois da alteração, a aplicação continuará ligada com a nova palavra-passe.':
          'After the change, the app will remain signed in with the new password.',
      'Voltar': 'Back',
      'Mantenha a sua conta segura': 'Keep your account secure',
      'Por segurança, altera a palavra-passe fornecida pela empresa antes de continuar.':
          'For security, change the password provided by the company before continuing.',
      'Dicas de Segurança': 'Security Tips',
      'Use uma combinação única de letras, números e símbolos':
          'Use a unique combination of letters, numbers, and symbols',
      'Evite usar informações pessoais óbvias':
          'Avoid using obvious personal information',
      'Não reutilize palavras-passe de outras contas':
          'Do not reuse passwords from other accounts',
      'Altere a sua palavra-passe regularmente':
          'Change your password regularly',
      'Gamification': 'Gamification',
      'Ranking e Conquistas': 'Ranking and Achievements',
      'A Sua Posição': 'Your Position',
      'Pontos': 'Points',
      'Badges': 'Badges',
      'Conquistas Especiais': 'Special Achievements',
      'Sem conquistas especiais sincronizadas.':
          'No synced special achievements.',
      'Top Consultores - Hybrid Cloud': 'Top Consultants - Hybrid Cloud',
      'Sem ranking local sincronizado.': 'No local ranking synced.',
      'pontos': 'points',
      'Evolução Profissional': 'Professional Development',
      'Sem eventos de evolução sincronizados.': 'No synced development events.',
      'Não foi possível atualizar as notificações.':
          'Could not update notifications.',
      'Não foi possível marcar a notificação como lida.':
          'Could not mark the notification as read.',
      'Notificações': 'Notifications',
      'Marcar todas': 'Mark all',
      'Marcar como\nlida': 'Mark as\nread',
      'Marcar como lida': 'Mark as read',
      '1 nova': '1 new',
      'Sem notificações sincronizadas.': 'No synced notifications.',
      'Dica': 'Tip',
      'Ative as notificações para receber alertas em tempo real sobre aprovações e badges a expirar.':
          'Enable notifications to receive real-time alerts about approvals and expiring badges.',
      'Não foi possível submeter candidatura.':
          'Could not submit the application.',
      'Candidatura guardada no telemóvel. Será enviada automaticamente quando houver Internet.':
          'Application saved on this device. It will be sent automatically when Internet is available.',
      'Pendente de envio': 'Pending upload',
      'Falha no envio': 'Upload failed',
      'Guardada no telemóvel e a aguardar ligação à Internet.':
          'Saved on this device and waiting for an Internet connection.',
      'Não foi possível enviar a candidatura.':
          'The application could not be sent.',
      'Sessão expirada. Inicia sessão novamente.':
          'Your session expired. Sign in again.',
      'Catálogo de Badges': 'Badge Catalog',
      'Pesquisar badges...': 'Search badges...',
      'Todos': 'All',
      'Disponíveis': 'Available',
      'Em candidatura': 'Applied',
      'Sem descrição local sincronizada.': 'No synced local description.',
      'Requisitos': 'Requirements',
      'Consulte a descrição de cada evidência necessária antes de iniciar a candidatura.':
          'Review each required evidence description before starting the application.',
      'Este badge não tem requisitos sincronizados. Pode submeter a candidatura sem evidências.':
          'This badge has no synced requirements. You can submit the application without evidence.',
      'Candidatar a Badge': 'Apply for Badge',
      'Não foi possível ler o ficheiro.': 'Could not read the file.',
      'Submeta as evidências exigidas pela API para esta candidatura.':
          'Submit the evidence required by the API for this application.',
      'Upload de Evidências': 'Evidence Upload',
      'Anexe um PDF, JPG ou PNG em cada requisito antes de submeter.':
          'Attach a PDF, JPG, or PNG to each requirement before submitting.',
      'A submeter...': 'Submitting...',
      'Submeter candidatura': 'Submit application',
      'Complete todos os requisitos': 'Complete all requirements',
      'Evidências enviadas': 'Submitted evidence',
      'Esta candidatura ainda não tem evidências sincronizadas localmente.':
          'This application has no locally synced evidence yet.',
      'Abrir evidência': 'Open evidence',
      'Upload Evidência (PDF, Imagem)': 'Upload Evidence (PDF, Image)',
      'Requisito sem identificador sincronizado.':
          'Requirement has no synced identifier.',
      'Trocar ficheiro': 'Replace file',
      'Remover ficheiro': 'Remove file',
      'Faça upload de todas as evidências necessárias antes de submeter a candidatura.':
          'Upload all required evidence before submitting the application.',
      'Sem badges de catálogo sincronizados.': 'No synced catalog badges.',
      'URL da evidência inválido.': 'Invalid evidence URL.',
      'Não foi possível abrir a evidência.': 'Could not open the evidence.',
      'Tamanho desconhecido': 'Unknown size',
      'Meus Badges': 'My Badges',
      'Candidaturas e conquistas sincronizadas':
          'Synced applications and achievements',
      'Total': 'Total',
      'Conquistados': 'Earned',
      'Rejeitados': 'Rejected',
      'Submetida em': 'Submitted on',
      'Última atualização': 'Last updated',
      'Sem evidências sincronizadas para esta candidatura.':
          'No synced evidence for this application.',
      'Fechar': 'Close',
      'Sem candidaturas sincronizadas.': 'No synced applications.',
      'Quando submeter ou conquistar badges, eles aparecem aqui.':
          'Submitted or earned badges will appear here.',
      'Conquistas especiais': 'Special achievements',
      'Desbloqueadas': 'Unlocked',
      'Pontos Extra': 'Bonus Points',
      'Progresso': 'Progress',
      'Primeiro Passo': 'First Step',
      'Conquistou o seu primeiro badge': 'Earned your first badge',
      'Obter 1 badge': 'Earn 1 badge',
      'Comum': 'Common',
      'Trio de Sucesso': 'Success Trio',
      'Completou 3 badges na timeline proposta':
          'Completed 3 badges in the proposed timeline',
      'Completar 3 badges na timeline': 'Complete 3 badges in the timeline',
      'Raro': 'Rare',
      'Velocista': 'Speedster',
      'Obteve 5 badges em menos de 3 meses':
          'Earned 5 badges in under 3 months',
      '5 badges em 3 meses (3/5 completos)':
          '5 badges in 3 months (3/5 complete)',
      'Certificação Premium': 'Premium Certification',
      'Conquistou uma certificação paga oficial':
          'Earned an official paid certification',
      'Obter certificação paga (AWS/Azure/etc)':
          'Earn a paid certification (AWS/Azure/etc)',
      'Épico': 'Epic',
      'Colecionador': 'Collector',
      'Possui 10 badges diferentes': 'Owns 10 different badges',
      '10 badges totais (4/10 completos)': '10 total badges (4/10 complete)',
      'Especialista Multi-Cloud': 'Multi-Cloud Specialist',
      'Certificações em AWS, Azure e GCP':
          'Certifications in AWS, Azure, and GCP',
      'Certificações nas 3 clouds principais':
          'Certifications in the 3 main clouds',
      'Lendário': 'Legendary',
      'Maratona de Conhecimento': 'Knowledge Marathon',
      'Completou 3 badges no mesmo mês': 'Completed 3 badges in the same month',
      '3 badges em 1 mês (2/3 completos)': '3 badges in 1 month (2/3 complete)',
      'Mestre da Área': 'Area Master',
      'Todos os badges disponíveis na sua Service Line':
          'All badges available in your Service Line',
      'Completar todos badges da área': 'Complete all badges in the area',
      'Trilha Completa': 'Complete Path',
      'Completou um Learning Path inteiro': 'Completed an entire Learning Path',
      'Completar todos badges de um Learning Path':
          'Complete all badges in a Learning Path',
      'Consistência Anual': 'Annual Consistency',
      'Obteve pelo menos 1 badge por mês durante 12 meses':
          'Earned at least 1 badge per month for 12 months',
      '1 badge/mês por 12 meses (2/12 meses)':
          '1 badge/month for 12 months (2/12 months)',
      'Pode selecionar até 4 badges.': 'You can select up to 4 badges.',
      'Assinatura guardada.': 'Signature saved.',
      'Não foi possível guardar a assinatura.': 'Could not save the signature.',
      'Assinatura de Email': 'Email Signature',
      'Configure a sua assinatura profissional com badges':
          'Configure your professional signature with badges',
      'Editar': 'Edit',
      'Pré-visualizar': 'Preview',
      'Exportar': 'Export',
      'Informações Pessoais': 'Personal Information',
      'Nome Completo': 'Full Name',
      'Cargo': 'Job Title',
      'Telefone': 'Phone',
      'Website': 'Website',
      'Badges\nConquistados': 'Earned\nBadges',
      'Selecione até 4 badges para mostrar na sua assinatura':
          'Select up to 4 badges to display in your signature',
      'Sem badges conquistados sincronizados.': 'No synced earned badges.',
      'A guardar...': 'Saving...',
      'Guardar seleção': 'Save selection',
      'Opções de Exibição': 'Display Options',
      'Mostrar Logo da Empresa': 'Show Company Logo',
      'Exibir logo Softinsa na assinatura':
          'Display the Softinsa logo in the signature',
      'Pré-visualização': 'Preview',
      'Esta é a aparência da sua assinatura nos emails':
          'This is how your signature will look in emails',
      'Exportar Assinatura': 'Export Signature',
      'Copiar HTML': 'Copy HTML',
      'Download HTML': 'Download HTML',
      'Como adicionar ao seu email': 'How to add it to your email',
      'Clique em "Copiar HTML" acima': 'Click "Copy HTML" above',
      'Abra Outlook → Ficheiro → Opções → Email → Assinaturas':
          'Open Outlook → File → Options → Mail → Signatures',
      'Clique em "Novo" e dê um nome à assinatura':
          'Click "New" and name the signature',
      'Cole o HTML copiado (Ctrl+V)': 'Paste the copied HTML (Ctrl+V)',
      'Clique em "OK" para guardar': 'Click "OK" to save',
      'Abra Gmail → Configurações → Ver todas as definições':
          'Open Gmail → Settings → See all settings',
      'Vá para o separador "Geral"': 'Go to the "General" tab',
      'Encontre a secção "Assinatura" e cole o HTML':
          'Find the "Signature" section and paste the HTML',
      'Role até ao final e clique em "Guardar alterações"':
          'Scroll to the bottom and click "Save Changes"',
      'Pronto para usar!': 'Ready to use!',
      'A sua assinatura personalizada está pronta. Mostre as suas certificações e conquistas em todos os emails que enviar!':
          'Your personalized signature is ready. Showcase your certifications and achievements in every email you send!',
      'CERTIFICAÇÕES': 'CERTIFICATIONS',
      'Sem badges selecionados': 'No badges selected',
      'A assinatura será exibida automaticamente no final de todos os seus emails. Certifique-se de que as informações estão corretas antes de exportar.':
          'The signature will appear automatically at the end of your emails. Check that the information is correct before exporting.',
      'Consultores': 'Consultants',
      'Pesquisar consultores...': 'Search consultants...',
      'Nenhum consultor encontrado.': 'No consultants found.',
      'Badges Total': 'Total Badges',
      'Especiais': 'Special',
      'Você': 'You',
      'Perfil profissional sincronizado a partir da plataforma.':
          'Professional profile synced from the platform.',
      'Conquistas': 'Achievements',
      'Stats': 'Stats',
      'Badges Conquistados': 'Earned Badges',
      'Sem badges conquistados': 'No earned badges',
      'Ainda não existem badges guardados localmente para este consultor.':
          'There are no locally stored badges for this consultant yet.',
      'Sem conquistas especiais': 'No special achievements',
      'Ainda não existem conquistas especiais guardadas localmente.':
          'There are no locally stored special achievements yet.',
      'Taxa de Conclusão': 'Completion Rate',
      'Crescimento Mensal': 'Monthly Growth',
      'Aumento de pontos no último mês': 'Points increase in the last month',
      'Dias com Atividade': 'Active Days',
      'Dias distintos com badges ou conquistas registadas':
          'Distinct days with registered badges or achievements',
      'Resumo de Atividade': 'Activity Summary',
      'Total de Badges': 'Total Badges',
      'Dias ativos': 'Active days',
      'Pontos Totais': 'Total Points',
      'Data indisponível': 'Date unavailable',
      'Desbloqueado sem data registada': 'Unlocked with no recorded date',
      'SUBMITTED': 'SUBMITTED',
      'Submitida': 'Submitted',
      'VALIDATED': 'VALIDATED',
      'Validada': 'Validated',
      'APPROVED': 'APPROVED',
      'Aprovada': 'Approved',
      'REJECTED': 'REJECTED',
      'Rejeitada': 'Rejected',
      'OPEN': 'OPEN',
      'Em análise': 'Under review',
      'Aberta': 'Open',
      'Em validação': 'Under validation',
      'Em aprovação': 'Awaiting approval',
      'Sem estado': 'No status',
      'Área': 'Area',
      'Campo obrigatório': 'Required field',
      'Email inválido': 'Invalid email',
      'As palavras-passe não coincidem': 'The passwords do not match',
      'A palavra-passe deve ter pelo menos 8 caracteres.':
          'The password must be at least 8 characters long.',
      'Recuperar palavra-passe': 'Recover password',
      'Receba um link seguro no email. Também pode colar abaixo o token incluído no link.':
          'Receive a secure link by email. You can also paste the token from the link below.',
      'A enviar...': 'Sending...',
      'Enviar email de recuperação': 'Send recovery email',
      'Token de recuperação': 'Recovery token',
      'Cole o token recebido': 'Paste the token you received',
      'A redefinir...': 'Resetting...',
      'Redefinir palavra-passe': 'Reset password',
      'A sua password foi redefinida com sucesso.':
          'Your password has been reset successfully.',
      'Cancelar': 'Cancel',
      'Confirmo que li e aceito esta política RGPD.':
          'I confirm that I have read and accept this GDPR policy.',
      'A aceitar...': 'Accepting...',
      'Aceitar e continuar': 'Accept and continue',
      'Terminar sessão': 'Sign out',
      'Pretende terminar a sua sessão?': 'Do you want to sign out?',
      'Email de confirmação reenviado.': 'Confirmation email sent again.',
      'Confirme o seu email': 'Confirm your email',
      'Voltar ao login': 'Back to sign in',
      'A reenviar...': 'Resending...',
      'Reenviar email': 'Resend email',
      'Não foi possível criar o objetivo.': 'Could not create the goal.',
      'Não foi possível atualizar o objetivo.': 'Could not update the goal.',
      'Não foi possível remover o objetivo.': 'Could not delete the goal.',
      'Criar objetivo': 'Create goal',
      'Prazo ultrapassado': 'Overdue',
      'Concluído': 'Completed',
      'Remover objetivo': 'Delete goal',
      'Novo objetivo': 'New goal',
      'Título': 'Title',
      'Descrição': 'Description',
      'Data limite': 'Due date',
      'Prioridade': 'Priority',
      'Alta': 'High',
      'Normal': 'Normal',
      'Baixa': 'Low',
      'Criar': 'Create',
      'Marco alcançado!': 'Milestone reached!',
      'Conquistado em': 'Earned on',
      'Expirou em': 'Expired on',
      'Expira em': 'Expires on',
      'Histórico do pedido': 'Application history',
      'Página pública': 'Public page',
      'Verificar': 'Verify',
      'Certificado PDF': 'PDF certificate',
      'Não foi possível abrir o link.': 'Could not open the link.',
      'Link público indisponível.': 'Public link unavailable.',
    },
    'es': {
      'Bom dia,': 'Buenos días,',
      'Boa tarde,': 'Buenas tardes,',
      'Boa noite,': 'Buenas noches,',
      'Bem-vindo!': '¡Bienvenido!',
      'Seja bem-vindo novamente': 'Bienvenido de nuevo',
      'Consultor': 'Consultor',
      'Consultora': 'Consultora',
      'Consultor Júnior': 'Consultor Júnior',
      'Consultora Júnior': 'Consultora Júnior',
      'Consultor Sénior': 'Consultor Sénior',
      'Consultora Sénior': 'Consultora Sénior',
      'Informações': 'Información',
      'O badge AWS Cloud Practitioner expira em 30 dias. Renove a sua certificação.':
          'El badge AWS Cloud Practitioner caduca en 30 días. Renueva tu certificación.',
      '3 novas conquistas desbloqueadas!': '¡3 nuevos logros desbloqueados!',
      'Próximo Nível do OutSystems que já completou':
          'Siguiente nivel de OutSystems después del completado',
      'Nível A': 'Nivel A',
      'Nível B': 'Nivel B',
      'Próximo Nível': 'Siguiente Nivel',
      '2-3 meses': '2-3 meses',
      '1-2 meses': '1-2 meses',
      '3-4 meses': '3-4 meses',
      'OutSystems Nível A completado': 'OutSystems Nivel A completado',
      'Recomendado para a sua Service Line: Hybrid Cloud':
          'Recomendado para tu Service Line: Hybrid Cloud',
      'Próximo passo após Azure Fundamentals':
          'Siguiente paso después de Azure Fundamentals',
      'Azure Fundamentals completado': 'Azure Fundamentals completado',
      'Complementa as suas skills de cloud':
          'Complementa tus habilidades de cloud',
      'Informacoes': 'Información',
      'Dados sincronizados a partir da API.':
          'Datos sincronizados desde la API.',
      'O seu badge Nível Júnior - OutSystems foi aprovado!':
          '¡Tu badge Nivel Júnior - OutSystems fue aprobado!',
      'O badge AWS Cloud Practitioner expira em 30 dias':
          'El badge AWS Cloud Practitioner caduca en 30 días',
      'Feedback necessário para o badge Azure Fundamentals':
          'Se necesita feedback para el badge Azure Fundamentals',
      'Primeiros 100 utilizadores da plataforma':
          'Primeros 100 usuarios de la plataforma',
      '10+ badges conquistados': '10+ badges ganados',
      'Badge Azure Fundamentals aprovado': 'Badge Azure Fundamentals aprobado',
      'Candidatura em validação': 'Candidatura en validación',
      'Badge aprovada': 'Badge aprobado',
      'Sessao expirada. Inicie sessao novamente.':
          'Sesión caducada. Inicia sesión de nuevo.',
      'Preencha todos os campos.': 'Completa todos los campos.',
      'As palavras-passe não coincidem.': 'Las contraseñas no coinciden.',
      'Aceite os termos para continuar.': 'Acepta los términos para continuar.',
      'Nao foi possivel comunicar com a API.':
          'No se pudo conectar con la API.',
      'Criar conta': 'Crear cuenta',
      'Crie uma conta para iniciar.': 'Crea una cuenta para comenzar.',
      'Nome': 'Nombre',
      'Endereço email': 'Dirección de email',
      'Palavra-passe da empresa': 'Contraseña de la empresa',
      'Nova palavra-passe': 'Nueva contraseña',
      'Criar palavra-passe': 'Crear contraseña',
      'Confirmar palavra-passe': 'Confirmar contraseña',
      'A criar conta...': 'Creando cuenta...',
      'Continuar': 'Continuar',
      "I've read and agree with the ": 'He leído y acepto los ',
      'Terms and Conditions': 'Términos y Condiciones',
      ' and the ': ' y la ',
      'Privacy Policy': 'Política de Privacidad',
      'Preencha o email e a palavra-passe.':
          'Introduce el email y la contraseña.',
      'Entrar': 'Entrar',
      'Palavra-passe': 'Contraseña',
      'Esqueceste-te da palavra-passe?': '¿Olvidaste tu contraseña?',
      'Guardar dados login': 'Recordar datos de acceso',
      'A entrar...': 'Entrando...',
      'Login': 'Entrar',
      'Não foi possível carregar os dados.': 'No se pudieron cargar los datos.',
      'Total de Pontos': 'Puntos Totales',
      'Continue a evoluir no seu percurso técnico':
          'Sigue avanzando en tu recorrido técnico',
      'Recomendado para Si': 'Recomendado para Ti',
      'Ver Todas': 'Ver Todas',
      'Sugestões Personalizadas': 'Sugerencias Personalizadas',
      'Baseadas no seu progresso atual e na sua área: OutSystems':
          'Basadas en tu progreso actual y tu área: OutSystems',
      'Ver detalhes do badge': 'Ver detalles del badge',
      'Relacionado': 'Relacionado',
      'Pré-requisitos:': 'Prerrequisitos:',
      'Explorar Mais Badges': 'Explorar Más Badges',
      'Badges ganhos': 'Badges ganados',
      'Em progresso': 'En progreso',
      'Insira o código de 4 dígitos.': 'Introduce el código de 4 dígitos.',
      'Código enviado novamente.': 'Código enviado de nuevo.',
      'Insira o código de confirmação': 'Introduce el código de confirmación',
      'Enviar novamente': 'Enviar de nuevo',
      'Palavra-passe currentPassword == newPasswordsucesso.':
          'Contraseña cambiada correctamente.',
      'Palavra-Passe Atual': 'Contraseña Actual',
      'Insira a palavra-passe fornecida pela empresa':
          'Introduce la contraseña proporcionada por la empresa',
      'Nova Palavra-Passe': 'Nueva Contraseña',
      'Insira a nova palavra-passe': 'Introduce la nueva contraseña',
      'Requisitos da palavra-passe:': 'Requisitos de la contraseña:',
      'Mínimo de 8 caracteres': 'Mínimo 8 caracteres',
      'Pelo menos uma letra maiúscula': 'Al menos una letra mayúscula',
      'Pelo menos uma letra minúscula': 'Al menos una letra minúscula',
      'Pelo menos um número': 'Al menos un número',
      'Pelo menos um caractere especial (!@#\$%^&*)':
          'Al menos un carácter especial (!@#\$%^&*)',
      'Diferente da palavra-passe atual': 'Diferente de la contraseña actual',
      'Confirmar Nova Palavra-Passe': 'Confirmar Nueva Contraseña',
      'Confirme a nova palavra-passe': 'Confirma la nueva contraseña',
      'A alterar...': 'Cambiando...',
      'Alterar Palavra-Passe': 'Cambiar Contraseña',
      'Depois da alteração, a aplicação continuará ligada com a nova palavra-passe.':
          'Después del cambio, la aplicación seguirá conectada con la nueva contraseña.',
      'Voltar': 'Volver',
      'Mantenha a sua conta segura': 'Mantén tu cuenta segura',
      'Por segurança, altera a palavra-passe fornecida pela empresa antes de continuar.':
          'Por seguridad, cambia la contraseña proporcionada por la empresa antes de continuar.',
      'Dicas de Segurança': 'Consejos de Seguridad',
      'Use uma combinação única de letras, números e símbolos':
          'Usa una combinación única de letras, números y símbolos',
      'Evite usar informações pessoais óbvias':
          'Evita usar información personal obvia',
      'Não reutilize palavras-passe de outras contas':
          'No reutilices contraseñas de otras cuentas',
      'Altere a sua palavra-passe regularmente':
          'Cambia tu contraseña regularmente',
      'Ranking e Conquistas': 'Ranking y Logros',
      'A Sua Posição': 'Tu Posición',
      'Pontos': 'Puntos',
      'Conquistas Especiais': 'Logros Especiales',
      'Sem conquistas especiais sincronizadas.':
          'No hay logros especiales sincronizados.',
      'Top Consultores - Hybrid Cloud': 'Top Consultores - Hybrid Cloud',
      'Sem ranking local sincronizado.': 'No hay ranking local sincronizado.',
      'pontos': 'puntos',
      'Evolução Profissional': 'Evolución Profesional',
      'Sem eventos de evolução sincronizados.':
          'No hay eventos de evolución sincronizados.',
      'Não foi possível atualizar as notificações.':
          'No se pudieron actualizar las notificaciones.',
      'Não foi possível marcar a notificação como lida.':
          'No se pudo marcar la notificación como leída.',
      'Notificações': 'Notificaciones',
      'Marcar todas': 'Marcar todas',
      'Marcar como\nlida': 'Marcar como\nleída',
      'Marcar como lida': 'Marcar como leída',
      '1 nova': '1 nueva',
      'Sem notificações sincronizadas.': 'No hay notificaciones sincronizadas.',
      'Dica': 'Consejo',
      'Ative as notificações para receber alertas em tempo real sobre aprovações e badges a expirar.':
          'Activa las notificaciones para recibir alertas en tiempo real sobre aprobaciones y badges próximos a caducar.',
      'Não foi possível submeter candidatura.':
          'No se pudo enviar la candidatura.',
      'Candidatura guardada no telemóvel. Será enviada automaticamente quando houver Internet.':
          'Candidatura guardada en el dispositivo. Se enviará automáticamente cuando haya Internet.',
      'Pendente de envio': 'Pendiente de envío',
      'Falha no envio': 'Error de envío',
      'Guardada no telemóvel e a aguardar ligação à Internet.':
          'Guardada en el dispositivo y a la espera de conexión a Internet.',
      'Não foi possível enviar a candidatura.':
          'No se pudo enviar la candidatura.',
      'Sessão expirada. Inicia sessão novamente.':
          'La sesión ha caducado. Inicia sesión de nuevo.',
      'Catálogo de Badges': 'Catálogo de Badges',
      'Pesquisar badges...': 'Buscar badges...',
      'Todos': 'Todos',
      'Disponíveis': 'Disponibles',
      'Em candidatura': 'En candidatura',
      'Sem descrição local sincronizada.':
          'Sin descripción local sincronizada.',
      'Requisitos': 'Requisitos',
      'Consulte a descrição de cada evidência necessária antes de iniciar a candidatura.':
          'Consulta la descripción de cada evidencia necesaria antes de iniciar la candidatura.',
      'Este badge não tem requisitos sincronizados. Pode submeter a candidatura sem evidências.':
          'Este badge no tiene requisitos sincronizados. Puedes enviar la candidatura sin evidencias.',
      'Candidatar a Badge': 'Solicitar Badge',
      'Não foi possível ler o ficheiro.': 'No se pudo leer el archivo.',
      'Submeta as evidências exigidas pela API para esta candidatura.':
          'Envía las evidencias exigidas por la API para esta candidatura.',
      'Upload de Evidências': 'Carga de Evidencias',
      'Anexe um PDF, JPG ou PNG em cada requisito antes de submeter.':
          'Adjunta un PDF, JPG o PNG en cada requisito antes de enviar.',
      'A submeter...': 'Enviando...',
      'Submeter candidatura': 'Enviar candidatura',
      'Complete todos os requisitos': 'Completa todos los requisitos',
      'Evidências enviadas': 'Evidencias enviadas',
      'Esta candidatura ainda não tem evidências sincronizadas localmente.':
          'Esta candidatura todavía no tiene evidencias sincronizadas localmente.',
      'Abrir evidência': 'Abrir evidencia',
      'Upload Evidência (PDF, Imagem)': 'Cargar Evidencia (PDF, Imagen)',
      'Requisito sem identificador sincronizado.':
          'Requisito sin identificador sincronizado.',
      'Trocar ficheiro': 'Cambiar archivo',
      'Remover ficheiro': 'Eliminar archivo',
      'Faça upload de todas as evidências necessárias antes de submeter a candidatura.':
          'Carga todas las evidencias necesarias antes de enviar la candidatura.',
      'Sem badges de catálogo sincronizados.':
          'No hay badges de catálogo sincronizados.',
      'URL da evidência inválido.': 'URL de evidencia no válida.',
      'Não foi possível abrir a evidência.': 'No se pudo abrir la evidencia.',
      'Tamanho desconhecido': 'Tamaño desconocido',
      'Meus Badges': 'Mis Badges',
      'Candidaturas e conquistas sincronizadas':
          'Candidaturas y logros sincronizados',
      'Total': 'Total',
      'Conquistados': 'Ganados',
      'Rejeitados': 'Rechazados',
      'Submetida em': 'Enviada el',
      'Última atualização': 'Última actualización',
      'Sem evidências sincronizadas para esta candidatura.':
          'No hay evidencias sincronizadas para esta candidatura.',
      'Fechar': 'Cerrar',
      'Sem candidaturas sincronizadas.': 'No hay candidaturas sincronizadas.',
      'Quando submeter ou conquistar badges, eles aparecem aqui.':
          'Los badges enviados o ganados aparecerán aquí.',
      'Conquistas especiais': 'Logros especiales',
      'Desbloqueadas': 'Desbloqueados',
      'Pontos Extra': 'Puntos Extra',
      'Progresso': 'Progreso',
      'Primeiro Passo': 'Primer Paso',
      'Conquistou o seu primeiro badge': 'Ganaste tu primer badge',
      'Obter 1 badge': 'Obtener 1 badge',
      'Comum': 'Común',
      'Trio de Sucesso': 'Trío de Éxito',
      'Completou 3 badges na timeline proposta':
          'Completaste 3 badges en el plazo propuesto',
      'Completar 3 badges na timeline': 'Completar 3 badges en el plazo',
      'Raro': 'Raro',
      'Velocista': 'Velocista',
      'Obteve 5 badges em menos de 3 meses':
          'Obtuviste 5 badges en menos de 3 meses',
      '5 badges em 3 meses (3/5 completos)':
          '5 badges en 3 meses (3/5 completos)',
      'Certificação Premium': 'Certificación Premium',
      'Conquistou uma certificação paga oficial':
          'Obtuviste una certificación oficial de pago',
      'Obter certificação paga (AWS/Azure/etc)':
          'Obtener certificación de pago (AWS/Azure/etc)',
      'Épico': 'Épico',
      'Colecionador': 'Coleccionista',
      'Possui 10 badges diferentes': 'Posee 10 badges diferentes',
      '10 badges totais (4/10 completos)': '10 badges totales (4/10 completos)',
      'Especialista Multi-Cloud': 'Especialista Multi-Cloud',
      'Certificações em AWS, Azure e GCP':
          'Certificaciones en AWS, Azure y GCP',
      'Certificações nas 3 clouds principais':
          'Certificaciones en las 3 nubes principales',
      'Lendário': 'Legendario',
      'Maratona de Conhecimento': 'Maratón de Conocimiento',
      'Completou 3 badges no mesmo mês': 'Completaste 3 badges en el mismo mes',
      '3 badges em 1 mês (2/3 completos)': '3 badges en 1 mes (2/3 completos)',
      'Mestre da Área': 'Maestro del Área',
      'Todos os badges disponíveis na sua Service Line':
          'Todos los badges disponibles en tu Service Line',
      'Completar todos badges da área': 'Completar todos los badges del área',
      'Trilha Completa': 'Ruta Completa',
      'Completou um Learning Path inteiro':
          'Completaste un Learning Path entero',
      'Completar todos badges de um Learning Path':
          'Completar todos los badges de un Learning Path',
      'Consistência Anual': 'Consistencia Anual',
      'Obteve pelo menos 1 badge por mês durante 12 meses':
          'Obtuviste al menos 1 badge al mes durante 12 meses',
      '1 badge/mês por 12 meses (2/12 meses)':
          '1 badge/mes durante 12 meses (2/12 meses)',
      'Pode selecionar até 4 badges.': 'Puedes seleccionar hasta 4 badges.',
      'Assinatura guardada.': 'Firma guardada.',
      'Não foi possível guardar a assinatura.': 'No se pudo guardar la firma.',
      'Assinatura de Email': 'Firma de Email',
      'Configure a sua assinatura profissional com badges':
          'Configura tu firma profesional con badges',
      'Editar': 'Editar',
      'Pré-visualizar': 'Vista previa',
      'Exportar': 'Exportar',
      'Informações Pessoais': 'Información Personal',
      'Nome Completo': 'Nombre Completo',
      'Cargo': 'Cargo',
      'Telefone': 'Teléfono',
      'Website': 'Sitio web',
      'Badges\nConquistados': 'Badges\nGanados',
      'Selecione até 4 badges para mostrar na sua assinatura':
          'Selecciona hasta 4 badges para mostrar en tu firma',
      'Sem badges conquistados sincronizados.':
          'No hay badges ganados sincronizados.',
      'A guardar...': 'Guardando...',
      'Guardar seleção': 'Guardar selección',
      'Opções de Exibição': 'Opciones de Visualización',
      'Mostrar Logo da Empresa': 'Mostrar Logo de la Empresa',
      'Exibir logo Softinsa na assinatura':
          'Mostrar el logo de Softinsa en la firma',
      'Pré-visualização': 'Vista previa',
      'Esta é a aparência da sua assinatura nos emails':
          'Así se verá tu firma en los emails',
      'Exportar Assinatura': 'Exportar Firma',
      'Copiar HTML': 'Copiar HTML',
      'Download HTML': 'Descargar HTML',
      'Como adicionar ao seu email': 'Cómo añadirla a tu email',
      'Clique em "Copiar HTML" acima': 'Haz clic en "Copiar HTML" arriba',
      'Abra Outlook → Ficheiro → Opções → Email → Assinaturas':
          'Abre Outlook → Archivo → Opciones → Correo → Firmas',
      'Clique em "Novo" e dê um nome à assinatura':
          'Haz clic en "Nuevo" y asigna un nombre a la firma',
      'Cole o HTML copiado (Ctrl+V)': 'Pega el HTML copiado (Ctrl+V)',
      'Clique em "OK" para guardar': 'Haz clic en "Aceptar" para guardar',
      'Abra Gmail → Configurações → Ver todas as definições':
          'Abre Gmail → Configuración → Ver todos los ajustes',
      'Vá para o separador "Geral"': 'Ve a la pestaña "General"',
      'Encontre a secção "Assinatura" e cole o HTML':
          'Busca la sección "Firma" y pega el HTML',
      'Role até ao final e clique em "Guardar alterações"':
          'Desplázate al final y haz clic en "Guardar cambios"',
      'Pronto para usar!': '¡Lista para usar!',
      'A sua assinatura personalizada está pronta. Mostre as suas certificações e conquistas em todos os emails que enviar!':
          'Tu firma personalizada está lista. Muestra tus certificaciones y logros en todos los emails que envíes.',
      'CERTIFICAÇÕES': 'CERTIFICACIONES',
      'Sem badges selecionados': 'Sin badges seleccionados',
      'A assinatura será exibida automaticamente no final de todos os seus emails. Certifique-se de que as informações estão corretas antes de exportar.':
          'La firma aparecerá automáticamente al final de tus emails. Comprueba que la información sea correcta antes de exportar.',
      'Consultores': 'Consultores',
      'Pesquisar consultores...': 'Buscar consultores...',
      'Nenhum consultor encontrado.': 'No se encontraron consultores.',
      'Badges Total': 'Total de Badges',
      'Especiais': 'Especiales',
      'Você': 'Tú',
      'Perfil profissional sincronizado a partir da plataforma.':
          'Perfil profesional sincronizado desde la plataforma.',
      'Conquistas': 'Logros',
      'Badges Conquistados': 'Badges Ganados',
      'Sem badges conquistados': 'Sin badges ganados',
      'Ainda não existem badges guardados localmente para este consultor.':
          'Todavía no hay badges guardados localmente para este consultor.',
      'Sem conquistas especiais': 'Sin logros especiales',
      'Ainda não existem conquistas especiais guardadas localmente.':
          'Todavía no hay logros especiales guardados localmente.',
      'Taxa de Conclusão': 'Tasa de Finalización',
      'Crescimento Mensal': 'Crecimiento Mensual',
      'Aumento de pontos no último mês': 'Aumento de puntos en el último mes',
      'Dias com Atividade': 'Días con Actividad',
      'Dias distintos com badges ou conquistas registadas':
          'Días distintos con badges o logros registrados',
      'Resumo de Atividade': 'Resumen de Actividad',
      'Total de Badges': 'Total de Badges',
      'Dias ativos': 'Días activos',
      'Pontos Totais': 'Puntos Totales',
      'Data indisponível': 'Fecha no disponible',
      'Desbloqueado sem data registada': 'Desbloqueado sin fecha registrada',
      'Submitida': 'Enviada',
      'Validada': 'Validada',
      'Aprovada': 'Aprobada',
      'Rejeitada': 'Rechazada',
      'Em análise': 'En revisión',
      'Aberta': 'Abierta',
      'Em validação': 'En validación',
      'Em aprovação': 'En aprobación',
      'Sem estado': 'Sin estado',
      'Área': 'Área',
      'Campo obrigatório': 'Campo obligatorio',
      'Email inválido': 'Email no válido',
      'As palavras-passe não coincidem': 'Las contraseñas no coinciden',
      'A palavra-passe deve ter pelo menos 8 caracteres.':
          'La contraseña debe tener al menos 8 caracteres.',
      'Recuperar palavra-passe': 'Recuperar contraseña',
      'Receba um link seguro no email. Também pode colar abaixo o token incluído no link.':
          'Recibe un enlace seguro por email. También puedes pegar abajo el token incluido en el enlace.',
      'A enviar...': 'Enviando...',
      'Enviar email de recuperação': 'Enviar email de recuperación',
      'Token de recuperação': 'Token de recuperación',
      'Cole o token recebido': 'Pega el token recibido',
      'A redefinir...': 'Restableciendo...',
      'Redefinir palavra-passe': 'Restablecer contraseña',
      'A sua password foi redefinida com sucesso.':
          'Tu contraseña se ha restablecido correctamente.',
      'Cancelar': 'Cancelar',
      'Confirmo que li e aceito esta política RGPD.':
          'Confirmo que he leído y acepto esta política RGPD.',
      'A aceitar...': 'Aceptando...',
      'Aceitar e continuar': 'Aceptar y continuar',
      'Terminar sessão': 'Cerrar sesión',
      'Pretende terminar a sua sessão?': '¿Quieres cerrar la sesión?',
      'Email de confirmação reenviado.':
          'Email de confirmación enviado de nuevo.',
      'Confirme o seu email': 'Confirma tu email',
      'Voltar ao login': 'Volver al inicio de sesión',
      'A reenviar...': 'Reenviando...',
      'Reenviar email': 'Reenviar email',
      'Não foi possível criar o objetivo.': 'No se pudo crear el objetivo.',
      'Não foi possível atualizar o objetivo.':
          'No se pudo actualizar el objetivo.',
      'Não foi possível remover o objetivo.':
          'No se pudo eliminar el objetivo.',
      'Criar objetivo': 'Crear objetivo',
      'Prazo ultrapassado': 'Plazo vencido',
      'Concluído': 'Completado',
      'Remover objetivo': 'Eliminar objetivo',
      'Novo objetivo': 'Nuevo objetivo',
      'Título': 'Título',
      'Descrição': 'Descripción',
      'Data limite': 'Fecha límite',
      'Prioridade': 'Prioridad',
      'Alta': 'Alta',
      'Normal': 'Normal',
      'Baixa': 'Baja',
      'Criar': 'Crear',
      'Marco alcançado!': '¡Hito alcanzado!',
      'Conquistado em': 'Conseguido el',
      'Expirou em': 'Caducó el',
      'Expira em': 'Caduca el',
      'Histórico do pedido': 'Historial de la candidatura',
      'Página pública': 'Página pública',
      'Verificar': 'Verificar',
      'Certificado PDF': 'Certificado PDF',
      'Não foi possível abrir o link.': 'No se pudo abrir el enlace.',
      'Link público indisponível.': 'Enlace público no disponible.',
    },
  };
}

extension AppTranslation on BuildContext {
  String tr(String source) => AppStrings.of(this).translate(source);
}

class AppText extends StatelessWidget {
  const AppText(
    this.data, {
    super.key,
    this.style,
    this.strutStyle,
    this.textAlign,
    this.textDirection,
    this.locale,
    this.softWrap,
    this.overflow,
    this.textScaler,
    this.maxLines,
    this.semanticsLabel,
    this.textWidthBasis,
    this.textHeightBehavior,
    this.selectionColor,
  });

  final String data;
  final TextStyle? style;
  final StrutStyle? strutStyle;
  final TextAlign? textAlign;
  final TextDirection? textDirection;
  final Locale? locale;
  final bool? softWrap;
  final TextOverflow? overflow;
  final TextScaler? textScaler;
  final int? maxLines;
  final String? semanticsLabel;
  final TextWidthBasis? textWidthBasis;
  final TextHeightBehavior? textHeightBehavior;
  final Color? selectionColor;

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);
    return Text(
      strings.translate(data),
      style: style,
      strutStyle: strutStyle,
      textAlign: textAlign,
      textDirection: textDirection,
      locale: locale,
      softWrap: softWrap,
      overflow: overflow,
      textScaler: textScaler,
      maxLines: maxLines,
      semanticsLabel: semanticsLabel == null
          ? null
          : strings.translate(semanticsLabel!),
      textWidthBasis: textWidthBasis,
      textHeightBehavior: textHeightBehavior,
      selectionColor: selectionColor,
    );
  }
}
