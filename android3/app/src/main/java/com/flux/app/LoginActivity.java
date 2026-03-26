package com.flux.app;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.view.View;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import com.flux.app.databinding.ActivityLoginBinding;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;
import retrofit2.Retrofit;
import retrofit2.converter.gson.GsonConverterFactory;

public class LoginActivity extends AppCompatActivity {

    private ActivityLoginBinding binding;
    private ApiService apiService;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        binding = ActivityLoginBinding.inflate(getLayoutInflater());
        setContentView(binding.getRoot());

        SharedPreferences prefs = getSharedPreferences("flux_prefs", MODE_PRIVATE);
        if (prefs.contains("userId")) {
            startMainActivity();
            return;
        }

        Retrofit retrofit = new Retrofit.Builder()
                .baseUrl("https://flux-messenger-production.up.railway.app/")
                .addConverterFactory(GsonConverterFactory.create())
                .build();
        apiService = retrofit.create(ApiService.class);

        binding.btnLogin.setOnClickListener(v -> handleLogin());
        binding.btnToRegister.setOnClickListener(v -> {
            startActivity(new Intent(this, RegisterActivity.class));
        });
    }

    private void handleLogin() {
        String email = binding.etEmail.getText().toString().trim();
        String password = binding.etPassword.getText().toString().trim();

        if (email.isEmpty() || password.isEmpty()) {
            Toast.makeText(this, "Заполните все поля", Toast.LENGTH_SHORT).show();
            return;
        }

        binding.btnLogin.setEnabled(false);
        binding.btnLogin.setText("ВХОД...");

        apiService.login(new ApiService.LoginRequest(email, password)).enqueue(new Callback<ApiService.AuthResponse>() {
            @Override
            public void onResponse(Call<ApiService.AuthResponse> call, Response<ApiService.AuthResponse> response) {
                binding.btnLogin.setEnabled(true);
                binding.btnLogin.setText("ВОЙТИ");

                if (response.isSuccessful() && response.body() != null) {
                    saveUser(response.body().user);
                    startMainActivity();
                } else {
                    Toast.makeText(LoginActivity.this, "Ошибка входа", Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(Call<ApiService.AuthResponse> call, Throwable t) {
                binding.btnLogin.setEnabled(true);
                binding.btnLogin.setText("ВОЙТИ");
                Toast.makeText(LoginActivity.this, "Ошибка сети", Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void saveUser(ApiService.User user) {
        getSharedPreferences("flux_prefs", MODE_PRIVATE).edit()
                .putString("userId", user.id)
                .putString("userName", user.name)
                .putString("userEmail", user.email)
                .apply();
    }

    private void startMainActivity() {
        startActivity(new Intent(this, MainActivity.class));
        finish();
    }
}
