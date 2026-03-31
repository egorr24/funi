package com.renixst.flux.ui.adapter;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import androidx.recyclerview.widget.RecyclerView;
import com.renixst.flux.R;
import com.renixst.flux.models.Chat;
import com.renixst.flux.models.Message;
import com.renixst.flux.models.User;
import java.util.List;

public class SearchResultAdapter extends RecyclerView.Adapter<SearchResultAdapter.SearchResultViewHolder> {

    private List<Object> results;
    
    private static final int VIEW_TYPE_MESSAGE = 1;
    private static final int VIEW_TYPE_CHAT = 2;
    private static final int VIEW_TYPE_USER = 3;

    public SearchResultAdapter(List<Object> results) {
        this.results = results;
    }

    @Override
    public int getItemViewType(int position) {
        Object item = results.get(position);
        if (item instanceof Message) {
            return VIEW_TYPE_MESSAGE;
        } else if (item instanceof Chat) {
            return VIEW_TYPE_CHAT;
        } else if (item instanceof User) {
            return VIEW_TYPE_USER;
        }
        return 0;
    }

    @Override
    public SearchResultViewHolder onCreateViewHolder(ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_search_result, parent, false);
        return new SearchResultViewHolder(view);
    }

    @Override
    public void onBindViewHolder(SearchResultViewHolder holder, int position) {
        Object item = results.get(position);
        
        if (item instanceof Message) {
            holder.bind((Message) item);
        } else if (item instanceof Chat) {
            holder.bind((Chat) item);
        } else if (item instanceof User) {
            holder.bind((User) item);
        }
    }

    @Override
    public int getItemCount() {
        return results.size();
    }

    public static class SearchResultViewHolder extends RecyclerView.ViewHolder {
        private TextView titleTextView;
        private TextView descriptionTextView;

        public SearchResultViewHolder(View itemView) {
            super(itemView);
            titleTextView = itemView.findViewById(R.id.titleTextView);
            descriptionTextView = itemView.findViewById(R.id.descriptionTextView);
        }

        public void bind(Message message) {
            titleTextView.setText(message.getSenderName());
            descriptionTextView.setText(message.getEncryptedBody());
        }

        public void bind(Chat chat) {
            titleTextView.setText(chat.getTitle());
            descriptionTextView.setText(chat.getDescription() != null ? chat.getDescription() : "");
        }

        public void bind(User user) {
            titleTextView.setText(user.getName());
            descriptionTextView.setText(user.getEmail());
        }
    }
}
