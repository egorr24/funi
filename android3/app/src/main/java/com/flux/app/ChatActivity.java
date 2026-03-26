package com.flux.app;

import android.content.Context;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import android.widget.Toast;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import com.flux.app.databinding.ActivityChatBinding;
import io.socket.client.Socket;
import org.json.JSONException;
import org.json.JSONObject;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;
import retrofit2.Retrofit;
import retrofit2.converter.gson.GsonConverterFactory;

public class ChatActivity extends AppCompatActivity {

    private ActivityChatBinding binding;
    private MessageAdapter adapter;
    private ApiService apiService;
    private Socket socket;
    private String chatId, chatTitle, userId;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Anti-screenshot
        getWindow().setFlags(android.view.WindowManager.LayoutParams.FLAG_SECURE, android.view.WindowManager.LayoutParams.FLAG_SECURE);
        
        binding = ActivityChatBinding.inflate(getLayoutInflater());
        setContentView(binding.getRoot());

        chatId = getIntent().getStringExtra("chatId");
        chatTitle = getIntent().getStringExtra("chatTitle");
        userId = getSharedPreferences("flux_prefs", MODE_PRIVATE).getString("userId", "");

        binding.chatTitle.setText(chatTitle);
        binding.btnBack.setOnClickListener(v -> finish());

        Retrofit retrofit = new Retrofit.Builder()
                .baseUrl("https://flux-messenger-production.up.railway.app/")
                .addConverterFactory(GsonConverterFactory.create())
                .build();
        apiService = retrofit.create(ApiService.class);

        setupSocket();
        setupRecyclerView();
        fetchMessages();

        binding.btnSend.setOnClickListener(v -> sendMessage());
    }

    private void setupSocket() {
        SocketManager socketManager = SocketManager.getInstance();
        socketManager.connect();
        socket = socketManager.getSocket();

        socket.on("message:new", args -> {
            runOnUiThread(() -> {
                JSONObject data = (JSONObject) args[0];
                try {
                    ApiService.MessageResponse msg = new ApiService.MessageResponse();
                    msg.id = data.getString("id");
                    msg.body = data.getString("body");
                    msg.senderId = data.getString("senderId");
                    msg.senderName = data.getString("senderName");
                    msg.createdAt = System.currentTimeMillis();
                    
                    if (data.has("chatId") && data.getString("chatId").equals(chatId)) {
                        adapter.addMessage(msg);
                        binding.recyclerView.scrollToPosition(adapter.getItemCount() - 1);
                    }
                } catch (JSONException e) {
                    e.printStackTrace();
                }
            });
        });
    }

    private void setupRecyclerView() {
        binding.recyclerView.setLayoutManager(new LinearLayoutManager(this));
        adapter = new MessageAdapter(new ArrayList<>(), userId);
        binding.recyclerView.setAdapter(adapter);
    }

    private void fetchMessages() {
        apiService.getMessages(chatId).enqueue(new Callback<List<ApiService.MessageResponse>>() {
            @Override
            public void onResponse(Call<List<ApiService.MessageResponse>> call, Response<List<ApiService.MessageResponse>> response) {
                if (response.isSuccessful() && response.body() != null) {
                    adapter.setMessages(response.body());
                    binding.recyclerView.scrollToPosition(adapter.getItemCount() - 1);
                }
            }

            @Override
            public void onFailure(Call<List<ApiService.MessageResponse>> call, Throwable t) {
                Toast.makeText(ChatActivity.this, "Ошибка загрузки сообщений", Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void sendMessage() {
        String body = binding.messageInput.getText().toString().trim();
        if (body.isEmpty()) return;

        JSONObject payload = new JSONObject();
        try {
            payload.put("chatId", chatId);
            payload.put("senderId", userId);
            payload.put("body", body);
            socket.emit("message:send", payload);
            binding.messageInput.setText("");
        } catch (JSONException e) {
            e.printStackTrace();
        }
    }

    private class MessageAdapter extends RecyclerView.Adapter<RecyclerView.ViewHolder> {
        private static final int TYPE_MINE = 0;
        private static final int TYPE_OTHER = 1;

        private List<ApiService.MessageResponse> messages;
        private String currentUserId;
        private SimpleDateFormat sdf = new SimpleDateFormat("HH:mm", Locale.getDefault());

        MessageAdapter(List<ApiService.MessageResponse> messages, String userId) {
            this.messages = messages;
            this.currentUserId = userId;
        }

        void setMessages(List<ApiService.MessageResponse> messages) {
            this.messages = messages;
            notifyDataSetChanged();
        }

        void addMessage(ApiService.MessageResponse msg) {
            this.messages.add(msg);
            notifyItemInserted(messages.size() - 1);
        }

        @Override
        public int getItemViewType(int position) {
            return messages.get(position).senderId.equals(currentUserId) ? TYPE_MINE : TYPE_OTHER;
        }

        @NonNull
        @Override
        public RecyclerView.ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
            if (viewType == TYPE_MINE) {
                View v = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_message_mine, parent, false);
                return new MineViewHolder(v);
            } else {
                View v = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_message_other, parent, false);
                return new OtherViewHolder(v);
            }
        }

        @Override
        public void onBindViewHolder(@NonNull RecyclerView.ViewHolder holder, int position) {
            ApiService.MessageResponse msg = messages.get(position);
            String time = sdf.format(new Date(msg.createdAt));

            if (holder instanceof MineViewHolder) {
                MineViewHolder vh = (MineViewHolder) holder;
                vh.body.setText(msg.body);
                vh.time.setText(time);
                
                if (msg.mediaType != null && msg.mediaType.equals("image") && msg.isSecure) {
                    vh.ghostView.setVisibility(View.VISIBLE);
                    com.bumptech.glide.Glide.with(vh.itemView.getContext())
                        .asBitmap()
                        .load(msg.mediaUrl)
                        .into(new com.bumptech.glide.request.target.CustomTarget<android.graphics.Bitmap>() {
                            @Override
                            public void onResourceReady(@NonNull android.graphics.Bitmap resource, @Nullable com.bumptech.glide.request.transition.Transition<? super android.graphics.Bitmap> transition) {
                                vh.ghostView.setImage(resource);
                            }
                            @Override
                            public void onLoadCleared(@Nullable android.graphics.drawable.Drawable placeholder) {}
                        });
                } else {
                    vh.ghostView.setVisibility(View.GONE);
                }
            } else {
                OtherViewHolder vh = (OtherViewHolder) holder;
                vh.sender.setText(msg.senderName);
                vh.body.setText(msg.body);
                vh.time.setText(time);

                if (msg.mediaType != null && msg.mediaType.equals("image") && msg.isSecure) {
                    vh.ghostView.setVisibility(View.VISIBLE);
                    com.bumptech.glide.Glide.with(vh.itemView.getContext())
                        .asBitmap()
                        .load(msg.mediaUrl)
                        .into(new com.bumptech.glide.request.target.CustomTarget<android.graphics.Bitmap>() {
                            @Override
                            public void onResourceReady(@NonNull android.graphics.Bitmap resource, @Nullable com.bumptech.glide.request.transition.Transition<? super android.graphics.Bitmap> transition) {
                                vh.ghostView.setImage(resource);
                            }
                            @Override
                            public void onLoadCleared(@Nullable android.graphics.drawable.Drawable placeholder) {}
                        });
                } else {
                    vh.ghostView.setVisibility(View.GONE);
                }
            }
        }

        @Override
        public int getItemCount() { return messages.size(); }

        class MineViewHolder extends RecyclerView.ViewHolder {
            TextView body, time;
            NeuralGhostView ghostView;
            MineViewHolder(View v) { 
                super(v); 
                body = v.findViewById(R.id.tvMessage); 
                time = v.findViewById(R.id.tvTime);
                ghostView = v.findViewById(R.id.ghostView);
            }
        }

        class OtherViewHolder extends RecyclerView.ViewHolder {
            TextView sender, body, time;
            NeuralGhostView ghostView;
            OtherViewHolder(View v) { 
                super(v); 
                sender = v.findViewById(R.id.tvSender); 
                body = v.findViewById(R.id.tvMessage); 
                time = v.findViewById(R.id.tvTime);
                ghostView = v.findViewById(R.id.ghostView);
            }
        }
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (socket != null) {
            socket.off("message:new");
        }
    }
}
