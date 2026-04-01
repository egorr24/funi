package com.renixst.flux.api;

import android.content.Context;
import android.content.SharedPreferences;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import okhttp3.OkHttpClient;
import okhttp3.Interceptor;
import okhttp3.Request;
import okhttp3.logging.HttpLoggingInterceptor;
import retrofit2.Retrofit;
import retrofit2.converter.gson.GsonConverterFactory;

import java.io.IOException;
import java.util.Date;

public class RetrofitClient {
    private static Retrofit retrofit;
    private static final String BASE_URL = "https://funi-production.up.railway.app/api/";
    private static ApiService apiService;
    private static SharedPreferences sharedPreferences;
    private static Context context;

    public static void init(Context ctx) {
        context = ctx;
        sharedPreferences = context.getSharedPreferences("flux_prefs", Context.MODE_PRIVATE);
    }

    public static Retrofit getRetrofit() {
        if (retrofit == null) {
            OkHttpClient.Builder httpClient = new OkHttpClient.Builder();

            // Logging Interceptor (только для debug)
            HttpLoggingInterceptor loggingInterceptor = new HttpLoggingInterceptor();
            loggingInterceptor.setLevel(HttpLoggingInterceptor.Level.BODY);
            httpClient.addInterceptor(loggingInterceptor);

            // Auth Interceptor
            httpClient.addInterceptor(chain -> {
                Request originalRequest = chain.request();
                
                String accessToken = getAccessToken();
                if (accessToken != null && !accessToken.isEmpty()) {
                    Request authenticatedRequest = originalRequest.newBuilder()
                            .addHeader("Authorization", "Bearer " + accessToken)
                            .build();
                    return chain.proceed(authenticatedRequest);
                }
                
                return chain.proceed(originalRequest);
            });

            Gson gson = new GsonBuilder()
                    .setDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
                    .create();

            retrofit = new Retrofit.Builder()
                    .baseUrl(BASE_URL)
                    .client(httpClient.build())
                    .addConverterFactory(GsonConverterFactory.create(gson))
                    .build();
        }
        return retrofit;
    }

    public static ApiService getApiService() {
        if (apiService == null) {
            apiService = getRetrofit().create(ApiService.class);
        }
        return apiService;
    }

    // ============ Token Management ============

    public static void saveTokens(String accessToken, String refreshToken, long expiresIn) {
        SharedPreferences.Editor editor = sharedPreferences.edit();
        editor.putString("access_token", accessToken);
        editor.putString("refresh_token", refreshToken);
        editor.putLong("token_expires_at", System.currentTimeMillis() + (expiresIn * 1000));
        editor.apply();
    }

    public static String getAccessToken() {
        long expiresAt = sharedPreferences.getLong("token_expires_at", 0);
        if (expiresAt > 0 && System.currentTimeMillis() > expiresAt) {
            // Token expired
            return null;
        }
        return sharedPreferences.getString("access_token", null);
    }

    public static String getRefreshToken() {
        return sharedPreferences.getString("refresh_token", null);
    }

    public static void clearTokens() {
        SharedPreferences.Editor editor = sharedPreferences.edit();
        editor.remove("access_token");
        editor.remove("refresh_token");
        editor.remove("token_expires_at");
        editor.remove("user_id");
        editor.apply();
    }

    public static void saveUserId(String userId) {
        SharedPreferences.Editor editor = sharedPreferences.edit();
        editor.putString("user_id", userId);
        editor.apply();
    }

    public static String getUserId() {
        return sharedPreferences.getString("user_id", null);
    }
}
