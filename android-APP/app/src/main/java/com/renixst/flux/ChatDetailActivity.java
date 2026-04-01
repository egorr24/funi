package com.renixst.flux;

import android.os.Bundle;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ListView;
import android.widget.TextView;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import com.renixst.flux.api.RetrofitClient;
import com.renixst.flux.models.Message;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;
import java.util.ArrayList;
import java.util.List;

public class ChatDetailActivity extends AppCompatActivity {

    private String chatId;
    private String chatTitle;
    private TextView headerView;
    private ListView messagesList;
    private EditText messageInput;
    private Button sendButton;
    private List<Message> messages;
    private MessagesAdapter messagesAdapter;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_chat_detail);

        chatId = getIntent().getStringExtra("chatId");
        chatTitle = getIntent().getStringExtra("chatTitle");

        headerView = findViewById(R.id.headerTitle);
        messagesList = findViewById(R.id.messagesList);
        messageInput = findViewById(R.id.messageInput);
        sendButton = findViewById(R.id.sendButton);

        headerView.setText(chatTitle != null ? chatTitle : "Chat");

        messages = new ArrayList<>();
        messagesAdapter = new MessagesAdapter(this, messages);
        messagesList.setAdapter(messagesAdapter);

        sendButton.setOnClickListener(v -> sendMessage());

        loadMessages();
    }

    private void loadMessages() {
        RetrofitClient.getApiService().getMessages(chatId, 50, 0)
                .enqueue(new Callback<List<Message>>() {
                    @Override
                    public void onResponse(Call<List<Message>> call, Response<List<Message>> response) {
                        if (response.isSuccessful() && response.body() != null) {
                            messages.clear();
                            messages.addAll(response.body());
                            messagesAdapter.notifyDataSetChanged();
                            messagesList.setSelection(messages.size() - 1);
                        }
                    }

                    @Override
                    public void onFailure(Call<List<Message>> call, Throwable t) {
                        Toast.makeText(ChatDetailActivity.this, "Ошибка загрузки", Toast.LENGTH_SHORT).show();
                    }
                });
    }

    private void sendMessage() {
        String text = messageInput.getText().toString().trim();
        if (text.isEmpty()) {
            Toast.makeText(this, "Введите сообщение", Toast.LENGTH_SHORT).show();
            return;
        }

        Message message = new Message();
        message.chatId = chatId;
        message.senderId = RetrofitClient.getUserId();
        message.encryptedBody = text; // TODO: Encrypt with public key

        RetrofitClient.getApiService().sendMessage(message)
                .enqueue(new Callback<Message>() {
                    @Override
                    public void onResponse(Call<Message> call, Response<Message> response) {
                        if (response.isSuccessful()) {
                            messageInput.setText("");
                            messages.add(response.body());
                            messagesAdapter.notifyDataSetChanged();
                            messagesList.setSelection(messages.size() - 1);
                        }
                    }

                    @Override
                    public void onFailure(Call<Message> call, Throwable t) {
                        Toast.makeText(ChatDetailActivity.this, "Ошибка отправки", Toast.LENGTH_SHORT).show();
                    }
                });
    }

    @Override
    protected void onResume() {
        super.onResume();
        loadMessages();
    }
}
