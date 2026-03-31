package com.renixst.flux.ui.adapter;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.TextView;
import androidx.recyclerview.widget.RecyclerView;
import com.renixst.flux.R;
import com.renixst.flux.models.Chat;
import java.util.List;

public class ChatAdapter extends RecyclerView.Adapter<ChatAdapter.ChatViewHolder> {

    private List<Chat> chats;
    private OnChatClickListener onChatClickListener;

    public interface OnChatClickListener {
        void onChatClick(Chat chat);
    }

    public ChatAdapter(List<Chat> chats, OnChatClickListener listener) {
        this.chats = chats;
        this.onChatClickListener = listener;
    }

    @Override
    public ChatViewHolder onCreateViewHolder(ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_chat, parent, false);
        return new ChatViewHolder(view);
    }

    @Override
    public void onBindViewHolder(ChatViewHolder holder, int position) {
        Chat chat = chats.get(position);
        holder.bind(chat, onChatClickListener);
    }

    @Override
    public int getItemCount() {
        return chats.size();
    }

    public static class ChatViewHolder extends RecyclerView.ViewHolder {
        private TextView chatTitle;
        private TextView chatPreview;
        private TextView unreadBadge;
        private ImageView chatAvatar;

        public ChatViewHolder(View itemView) {
            super(itemView);
            chatTitle = itemView.findViewById(R.id.chatTitle);
            chatPreview = itemView.findViewById(R.id.chatPreview);
            unreadBadge = itemView.findViewById(R.id.unreadBadge);
            chatAvatar = itemView.findViewById(R.id.chatAvatar);
        }

        public void bind(Chat chat, OnChatClickListener listener) {
            chatTitle.setText(chat.getTitle());
            
            if (chat.getLastMessage() != null) {
                chatPreview.setText(chat.getLastMessage().getEncryptedBody());
            }

            if (chat.getUnreadCount() > 0) {
                unreadBadge.setVisibility(View.VISIBLE);
                unreadBadge.setText(String.valueOf(chat.getUnreadCount()));
            } else {
                unreadBadge.setVisibility(View.GONE);
            }

            itemView.setOnClickListener(v -> listener.onChatClick(chat));
        }
    }
}
