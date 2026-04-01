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

public class MainActivity extends AppCompatActivity {

    private EditText emailInput, passwordInput;
    private Button loginButton, registerButton;
    private ProgressBar loadingProgress;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        // Initialize RetrofitClient
        RetrofitClient.init(this);

        // Check if already logged in
        if (RetrofitClient.getAccessToken() != null) {
            startActivity(new Intent(this, ChatsActivity.class));
            finish();
            return;
        }

        // Initialize UI
        emailInput = findViewById(R.id.emailInput);
        passwordInput = findViewById(R.id.passwordInput);
        loginButton = findViewById(R.id.loginButton);
        registerButton = findViewById(R.id.registerButton);
        loadingProgress = findViewById(R.id.loadingProgress);

        loginButton.setOnClickListener(v -> handleLogin());
        registerButton.setOnClickListener(v -> startActivity(new Intent(this, RegisterActivity.class)));
    }

    private void handleLogin() {
        String email = emailInput.getText().toString().trim();
        String password = passwordInput.getText().toString().trim();

        if (email.isEmpty() || password.isEmpty()) {
            Toast.makeText(this, "Заполните все поля", Toast.LENGTH_SHORT).show();
            return;
        }

        loadingProgress.setVisibility(android.view.View.VISIBLE);
        loginButton.setEnabled(false);

        ApiService.LoginRequest request = new ApiService.LoginRequest();
        request.email = email;
        request.password = password;

        RetrofitClient.getApiService().login(request).enqueue(new Callback<ApiService.AuthResponse>() {
            @Override
            public void onResponse(Call<ApiService.AuthResponse> call, Response<ApiService.AuthResponse> response) {
                loadingProgress.setVisibility(android.view.View.GONE);
                loginButton.setEnabled(true);

                if (response.isSuccessful() && response.body() != null) {
                    ApiService.AuthResponse auth = response.body();
                    RetrofitClient.saveTokens(auth.accessToken, auth.refreshToken, auth.expiresIn);
                    RetrofitClient.saveUserId(auth.user.id);

                    Toast.makeText(MainActivity.this, "Успешный вход!", Toast.LENGTH_SHORT).show();
                    startActivity(new Intent(MainActivity.this, ChatsActivity.class));
                    finish();
                } else {
                    Toast.makeText(MainActivity.this, "Неверный email или пароль", Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(Call<ApiService.AuthResponse> call, Throwable t) {
                loadingProgress.setVisibility(android.view.View.GONE);
                loginButton.setEnabled(true);
                Toast.makeText(MainActivity.this, "Ошибка подключения: " + t.getMessage(), Toast.LENGTH_SHORT).show();
            }
        });
    }
}
