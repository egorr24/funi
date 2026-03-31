package com.renixst.flux.ui.activity;

import android.os.Bundle;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import com.renixst.flux.R;
import com.renixst.flux.managers.SessionManager;
import com.renixst.flux.models.Message;
import com.renixst.flux.network.ApiService;
import com.renixst.flux.network.NetworkModels.SendMessageRequest;
import com.renixst.flux.network.RetrofitClient;
import com.renixst.flux.ui.adapter.MessageAdapter;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;
import java.util.ArrayList;
import java.util.List;

public class ChatMessagesActivity extends AppCompatActivity {

    private RecyclerView messagesRecyclerView;
    private EditText messageInput;
    private Button sendButton;
    private TextView chatTitleTextView;
    
    private MessageAdapter messageAdapter;
    private List<Message> messagesList = new ArrayList<>();
    private SessionManager sessionManager;
    
    private String chatId;
    private String chatTitle;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_chat_messages);

        sessionManager = new SessionManager(this);
        // socketManager = WebSocketManager.getInstance();

        chatId = getIntent().getStringExtra("chatId");
        chatTitle = getIntent().getStringExtra("chatTitle");

        chatTitleTextView = findViewById(R.id.chatTitleTextView);
        messagesRecyclerView = findViewById(R.id.messagesRecyclerView);
        messageInput = findViewById(R.id.messageInput);
        sendButton = findViewById(R.id.sendButton);

        chatTitleTextView.setText(chatTitle);

        messagesRecyclerView.setLayoutManager(new LinearLayoutManager(this));
        messageAdapter = new MessageAdapter(messagesList, sessionManager.getUserId());
        messagesRecyclerView.setAdapter(messageAdapter);

        sendButton.setOnClickListener(v -> sendMessage());

        loadMessages();
        // setupSocketListeners();
        // socketManager.joinChat(chatId);
    }

    private void loadMessages() {
        ApiService apiService = RetrofitClient.getApiService();
        String token = "Bearer " + sessionManager.getToken();

        apiService.getMessages(chatId, token).enqueue(new Callback<List<Message>>() {
            @Override
            public void onResponse(Call<List<Message>> call, Response<List<Message>> response) {
                if (response.isSuccessful() && response.body() != null) {
                    messagesList.clear();
                    messagesList.addAll(response.body());
                    messageAdapter.notifyDataSetChanged();
                    messagesRecyclerView.scrollToPosition(messagesList.size() - 1);
                }
            }

            @Override
            public void onFailure(Call<List<Message>> call, Throwable t) {
                Toast.makeText(ChatMessagesActivity.this, "Error loading messages", Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void sendMessage() {
        String text = messageInput.getText().toString().trim();
        
        if (text.isEmpty()) {
            Toast.makeText(this, "Message cannot be empty", Toast.LENGTH_SHORT).show();
            return;
        }

        messageInput.setText("");

        // Simple encryption (should be replaced with proper AES encryption)
        String encryptedBody = encodeMessage(text);
        
        SendMessageRequest request = new SendMessageRequest(chatId, encryptedBody, "", "");
        ApiService apiService = RetrofitClient.getApiService();
        String token = "Bearer " + sessionManager.getToken();

        apiService.sendMessage(request, token).enqueue(new Callback<Message>() {
            @Override
            public void onResponse(Call<Message> call, Response<Message> response) {
                if (response.isSuccessful() && response.body() != null) {
                    Message message = response.body();
                    messagesList.add(message);
                    messageAdapter.notifyItemInserted(messagesList.size() - 1);
                    messagesRecyclerView.scrollToPosition(messagesList.size() - 1);
                }
            }

            @Override
            public void onFailure(Call<Message> call, Throwable t) {
                Toast.makeText(ChatMessagesActivity.this, "Failed to send message", Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void setupSocketListeners() {
        // TODO: Implement WebSocket listeners
        // socketManager.addMessageListener(...);
    }

    private String encodeMessage(String message) {
        // TODO: Implement proper AES encryption
        return message;
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        // socketManager.leaveChat(chatId);
    }
}
