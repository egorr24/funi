package com.renixst.flux.ui.activity;

import android.content.Intent;
import android.os.Bundle;
import android.widget.Button;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import com.renixst.flux.R;
import com.renixst.flux.managers.SessionManager;
import com.renixst.flux.models.Chat;
import com.renixst.flux.network.ApiService;
import com.renixst.flux.network.RetrofitClient;
import com.renixst.flux.ui.adapter.ChatAdapter;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;
import java.util.ArrayList;
import java.util.List;

public class MainActivity extends AppCompatActivity {

    private RecyclerView chatsRecyclerView;
    private Button logoutButton;
    private ChatAdapter chatAdapter;
    private SessionManager sessionManager;
    private List<Chat> chatsList = new ArrayList<>();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        sessionManager = new SessionManager(this);

        // Redirect if not logged in
        if (!sessionManager.isLoggedIn()) {
            startActivity(new Intent(MainActivity.this, LoginActivity.class));
            finish();
            return;
        }

        chatsRecyclerView = findViewById(R.id.chatsRecyclerView);
        logoutButton = findViewById(R.id.logoutButton);

        chatsRecyclerView.setLayoutManager(new LinearLayoutManager(this));
        chatAdapter = new ChatAdapter(chatsList, chat -> {
            Intent intent = new Intent(MainActivity.this, ChatMessagesActivity.class);
            intent.putExtra("chatId", chat.getId());
            intent.putExtra("chatTitle", chat.getTitle());
            startActivity(intent);
        });
        chatsRecyclerView.setAdapter(chatAdapter);

        logoutButton.setOnClickListener(v -> performLogout());

        loadChats();
        connectSocket();
    }

    private void loadChats() {
        ApiService apiService = RetrofitClient.getApiService();
        String token = "Bearer " + sessionManager.getToken();

        apiService.getChats(token).enqueue(new Callback<List<Chat>>() {
            @Override
            public void onResponse(Call<List<Chat>> call, Response<List<Chat>> response) {
                if (response.isSuccessful() && response.body() != null) {
                    chatsList.clear();
                    chatsList.addAll(response.body());
                    chatAdapter.notifyDataSetChanged();
                } else {
                    Toast.makeText(MainActivity.this, "Failed to load chats", Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(Call<List<Chat>> call, Throwable t) {
                Toast.makeText(MainActivity.this, "Error: " + t.getMessage(), Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void connectSocket() {
        SocketIOManager socketManager = SocketIOManager.getInstance();
        if (!socketManager.isConnected()) {
            socketManager.connect(sessionManager.getUserId(), sessionManager.getToken());
        }
    }

    private void performLogout() {
        sessionManager.clearSession();
        SocketIOManager.getInstance().disconnect();
        
        Intent intent = new Intent(MainActivity.this, LoginActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_NEW_TASK);
        startActivity(intent);
        finish();
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        SocketIOManager.getInstance().disconnect();
    }
}
