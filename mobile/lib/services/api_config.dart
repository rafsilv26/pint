class ApiConfig {
  static const String baseUrl = String.fromEnvironment(
    'SOFTINSA_API_URL',
    defaultValue: 'https://pint-flim.onrender.com/api',
  );
}
