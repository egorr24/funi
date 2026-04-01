package com.renixst.flux;

import android.content.Intent;
import android.os.Bundle;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ProgressBar;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import com.renixst.flux.api.ApiService;
import com.renixst.flux.api.RetrofitClient;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class RegisterActivity extends AppCompatActivity {

    private EditText nameInput, emailInput, passwordInput, confirmPasswordInput;
    private Button registerButton, backButton;
    private ProgressBar loadingProgress;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_register);

        nameInput = findViewById(R.id.nameInput);
        emailInput = findViewById(R.id.emailInput);
        passwordInput = findViewById(R.id.passwordInput);
        confirmPasswordInput = findViewById(R.id.confirmPasswordInput);
        registerButton = findViewById(R.id.registerButton);
        backButton = findViewById(R.id.backButton);
        loadingProgress = findViewById(R.id.loadingProgress);

        registerButton.setOnClickListener(v -> handleRegister());
        backButton.setOnClickListener(v -> finish());
    }

    private void handleRegister() {
        String name = nameInput.getText().toString().trim();
        String email = emailInput.getText().toString().trim();
        String password = passwordInput.getText().toString().trim();
        String confirmPassword = confirmPasswordInput.getText().toString().trim();

        if (name.isEmpty() || email.isEmpty() || password.isEmpty()) {
            Toast.makeText(this, "Заполните все поля", Toast.LENGTH_SHORT).show();
            return;
        }

        if (!password.equals(confirmPassword)) {
            Toast.makeText(this, "Пароли не совпадают", Toast.LENGTH_SHORT).show();
            return;
        }

        if (password.length() < 8) {
            Toast.makeText(this, "Пароль должен быть минимум 8 символов", Toast.LENGTH_SHORT).show();
            return;
        }

        loadingProgress.setVisibility(android.view.View.VISIBLE);
        registerButton.setEnabled(false);

        ApiService.RegisterRequest request = new ApiService.RegisterRequest();
        request.username = email.split("@")[0];
        request.email = email;
        request.password = password;
        request.displayName = name;

        RetrofitClient.getApiService().register(request).enqueue(new Callback<ApiService.AuthResponse>() {
            @Override
            public void onResponse(Call<ApiService.AuthResponse> call, Response<ApiService.AuthResponse> response) {
                loadingProgress.setVisibility(android.view.View.GONE);
                registerButton.setEnabled(true);

                if (response.isSuccessful() && response.body() != null) {
                    ApiService.AuthResponse auth = response.body();
                    RetrofitClient.saveTokens(auth.accessToken, auth.refreshToken, auth.expiresIn);
                    RetrofitClient.saveUserId(auth.user.id);

                    Toast.makeText(RegisterActivity.this, "Успешная регистрация!", Toast.LENGTH_SHORT).show();
                    startActivity(new Intent(RegisterActivity.this, ChatsActivity.class));
                    finish();
                } else {
                    Toast.makeText(RegisterActivity.this, "Ошибка регистрации", Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(Call<ApiService.AuthResponse> call, Throwable t) {
                loadingProgress.setVisibility(android.view.View.GONE);
                registerButton.setEnabled(true);
                Toast.makeText(RegisterActivity.this, "Ошибка подключения: " + t.getMessage(), Toast.LENGTH_SHORT).show();
            }
        });
    }
}
