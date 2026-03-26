package com.flux.app;

import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import android.widget.Toast;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import com.flux.app.databinding.FragmentChatsBinding;
import java.util.ArrayList;
import java.util.List;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;
import retrofit2.Retrofit;
import retrofit2.converter.gson.GsonConverterFactory;

public class ChatsFragment extends Fragment {

    private FragmentChatsBinding binding;
    private ChatAdapter adapter;
    private ApiService apiService;
    private String userId;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        binding = FragmentChatsBinding.inflate(inflater, container, false);
        
        userId = getContext().getSharedPreferences("flux_prefs", Context.MODE_PRIVATE).getString("userId", "");
        
        Retrofit retrofit = new Retrofit.Builder()
                .baseUrl("https://flux-messenger-production.up.railway.app/")
                .addConverterFactory(GsonConverterFactory.create())
                .build();
        apiService = retrofit.create(ApiService.class);

        setupRecyclerView();
        fetchChats();
        
        return binding.getRoot();
    }

    private void setupRecyclerView() {
        binding.recyclerView.setLayoutManager(new LinearLayoutManager(getContext()));
        adapter = new ChatAdapter(new ArrayList<>());
        binding.recyclerView.setAdapter(adapter);
    }

    private void fetchChats() {
        if (userId.isEmpty()) return;

        apiService.getChats(userId).enqueue(new Callback<List<ApiService.ChatResponse>>() {
            @Override
            public void onResponse(Call<List<ApiService.ChatResponse>> call, Response<List<ApiService.ChatResponse>> response) {
                if (response.isSuccessful() && response.body() != null) {
                    adapter.setChats(response.body());
                }
            }

            @Override
            public void onFailure(Call<List<ApiService.ChatResponse>> call, Throwable t) {
                Toast.makeText(getContext(), "Ошибка загрузки чатов", Toast.LENGTH_SHORT).show();
            }
        });
    }

    private class ChatAdapter extends RecyclerView.Adapter<ChatAdapter.ViewHolder> {
        private List<ApiService.ChatResponse> chats;
        ChatAdapter(List<ApiService.ChatResponse> chats) { this.chats = chats; }
        void setChats(List<ApiService.ChatResponse> chats) { this.chats = chats; notifyDataSetChanged(); }

        @NonNull
        @Override
        public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
            View v = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_chat, parent, false);
            return new ViewHolder(v);
        }

        @Override
        public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
            ApiService.ChatResponse chat = chats.get(position);
            holder.title.setText(chat.title);
            holder.lastMsg.setText(chat.lastMessagePreview);
            holder.avatar.setText(chat.avatar != null ? chat.avatar : chat.title.substring(0, Math.min(2, chat.title.length())).toUpperCase());
            
            holder.itemView.setOnClickListener(v -> {
                Intent intent = new Intent(getContext(), ChatActivity.class);
                intent.putExtra("chatId", chat.id);
                intent.putExtra("chatTitle", chat.title);
                startActivity(intent);
            });
        }

        @Override
        public int getItemCount() { return chats.size(); }

        class ViewHolder extends RecyclerView.ViewHolder {
            TextView title, lastMsg, avatar;
            ViewHolder(View v) {
                super(v);
                title = v.findViewById(R.id.chat_title);
                lastMsg = v.findViewById(R.id.chat_last_msg);
                avatar = v.findViewById(R.id.chat_avatar_text);
            }
        }
    }
}
