package com.renixst.flux;

import android.content.Intent;
import android.os.Bundle;
import android.widget.Button;
import android.widget.ListView;
import android.widget.ProgressBar;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import com.renixst.flux.api.ApiService;
import com.renixst.flux.api.RetrofitClient;
import com.renixst.flux.models.Chat;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;
import java.util.ArrayList;
import java.util.List;

public class ChatsActivity extends AppCompatActivity {

    private ListView chatsList;
    private ProgressBar loadingProgress;
    private Button logoutButton, newChatButton;
    private List<Chat> chats;
    private ChatsAdapter chatsAdapter;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_chats);

        chatsList = findViewById(R.id.chatsList);
        loadingProgress = findViewById(R.id.loadingProgress);
        logoutButton = findViewById(R.id.logoutButton);
        newChatButton = findViewById(R.id.newChatButton);

        chats = new ArrayList<>();
        chatsAdapter = new ChatsAdapter(this, chats);
        chatsList.setAdapter(chatsAdapter);

        logoutButton.setOnClickListener(v -> handleLogout());
        newChatButton.setOnClickListener(v -> handleNewChat());

        chatsList.setOnItemClickListener((parent, view, position, id) -> {
            Chat selectedChat = chats.get(position);
            Intent intent = new Intent(this, ChatDetailActivity.class);
            intent.putExtra("chatId", selectedChat.id);
            intent.putExtra("chatTitle", selectedChat.title);
            startActivity(intent);
        });

        loadChats();
    }

    private void loadChats() {
        loadingProgress.setVisibility(android.view.View.VISIBLE);

        RetrofitClient.getApiService().getChats().enqueue(new Callback<List<Chat>>() {
            @Override
            public void onResponse(Call<List<Chat>> call, Response<List<Chat>> response) {
                loadingProgress.setVisibility(android.view.View.GONE);

                if (response.isSuccessful() && response.body() != null) {
                    chats.clear();
                    chats.addAll(response.body());
                    chatsAdapter.notifyDataSetChanged();
                } else {
                    Toast.makeText(ChatsActivity.this, "Ошибка загрузки чатов", Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(Call<List<Chat>> call, Throwable t) {
                loadingProgress.setVisibility(android.view.View.GONE);
                Toast.makeText(ChatsActivity.this, "Ошибка подключения", Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void handleNewChat() {
        // Открыть диалог для поиска пользователя
        Intent intent = new Intent(this, SearchUsersActivity.class);
        startActivity(intent);
    }

    private void handleLogout() {
        RetrofitClient.getApiService().logout().enqueue(new Callback<Void>() {
            @Override
            public void onResponse(Call<Void> call, Response<Void> response) {
                RetrofitClient.clearTokens();
                startActivity(new Intent(ChatsActivity.this, MainActivity.class));
                finish();
            }

            @Override
            public void onFailure(Call<Void> call, Throwable t) {
                RetrofitClient.clearTokens();
                startActivity(new Intent(ChatsActivity.this, MainActivity.class));
                finish();
            }
        });
    }

    @Override
    protected void onResume() {
        super.onResume();
        loadChats();
    }
}
