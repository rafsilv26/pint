import '../models/dashboard_data.dart';

class BadgesApiService {
  Future<DashboardData> fetchDashboard() async {
    // Quando a API estiver pronta, a chamada HTTP da home entra aqui.
    throw const ApiNotAvailableException();
  }
}

class ApiNotAvailableException implements Exception {
  const ApiNotAvailableException();
}
