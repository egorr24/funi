package com.flux.app;

import android.content.Intent;
import android.os.Bundle;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import com.flux.app.databinding.ActivityRegisterBinding;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;
import retrofit2.Retrofit;
import retrofit2.converter.gson.GsonConverterFactory;

public class RegisterActivity extends AppCompatActivity {

    private ActivityRegisterBinding binding;
    private ApiService apiService;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        binding = ActivityRegisterBinding.inflate(getLayoutInflater());
        setContentView(binding.getRoot());

        Retrofit retrofit = new Retrofit.Builder()
                .baseUrl("https://flux-messenger-production.up.railway.app/")
                .addConverterFactory(GsonConverterFactory.create())
                .build();
        apiService = retrofit.create(ApiService.class);

        binding.btnRegister.setOnClickListener(v -> handleRegister());
        binding.btnToLogin.setOnClickListener(v -> finish());
    }

    private void handleRegister() {
        String name = binding.etName.getText().toString().trim();
        String email = binding.etEmail.getText().toString().trim();
        String password = binding.etPassword.getText().toString().trim();

        if (name.isEmpty() || email.isEmpty() || password.isEmpty()) {
            Toast.makeText(this, "Заполните все поля", Toast.LENGTH_SHORT).show();
            return;
        }

        binding.btnRegister.setEnabled(false);
        binding.btnRegister.setText("РЕГИСТРАЦИЯ...");

        apiService.register(new ApiService.RegisterRequest(name, email, password)).enqueue(new Callback<ApiService.AuthResponse>() {
            @Override
            public void onResponse(Call<ApiService.AuthResponse> call, Response<ApiService.AuthResponse> response) {
                binding.btnRegister.setEnabled(true);
                binding.btnRegister.setText("СОЗДАТЬ АККАУНТ");

                if (response.isSuccessful() && response.body() != null && response.body().ok) {
                    Toast.makeText(RegisterActivity.this, "Успешная регистрация!", Toast.LENGTH_SHORT).show();
                    finish();
                } else {
                    String error = (response.body() != null) ? response.body().error : "Ошибка регистрации";
                    Toast.makeText(RegisterActivity.this, error, Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(Call<ApiService.AuthResponse> call, Throwable t) {
                binding.btnRegister.setEnabled(true);
                binding.btnRegister.setText("СОЗДАТЬ АККАУНТ");
                Toast.makeText(RegisterActivity.this, "Ошибка сети", Toast.LENGTH_SHORT).show();
            }
        });
    }
}
