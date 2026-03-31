package com.renixst.flux.ui.activity;

import android.os.Bundle;
import android.widget.EditText;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import com.renixst.flux.R;
import com.renixst.flux.managers.SessionManager;
import com.renixst.flux.models.Chat;
import com.renixst.flux.models.Message;
import com.renixst.flux.models.User;
import com.renixst.flux.network.ApiService;
import com.renixst.flux.network.NetworkModels.SearchResponse;
import com.renixst.flux.network.RetrofitClient;
import com.renixst.flux.ui.adapter.SearchResultAdapter;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;
import java.util.ArrayList;
import java.util.List;

public class SearchActivity extends AppCompatActivity {

    private EditText searchInput;
    private RecyclerView searchResultsRecyclerView;
    private SearchResultAdapter searchAdapter;
    private SessionManager sessionManager;
    
    private List<Object> searchResults = new ArrayList<>();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_search);

        sessionManager = new SessionManager(this);

        searchInput = findViewById(R.id.searchInput);
        searchResultsRecyclerView = findViewById(R.id.searchResultsRecyclerView);

        searchResultsRecyclerView.setLayoutManager(new LinearLayoutManager(this));
        searchAdapter = new SearchResultAdapter(searchResults);
        searchResultsRecyclerView.setAdapter(searchAdapter);

        searchInput.addTextChangedListener(new android.text.TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {}

            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {
                if (s.length() > 2) {
                    performSearch(s.toString());
                }
            }

            @Override
            public void afterTextChanged(android.text.Editable s) {}
        });
    }

    private void performSearch(String query) {
        ApiService apiService = RetrofitClient.getApiService();
        String token = "Bearer " + sessionManager.getToken();

        apiService.search(query, token).enqueue(new Callback<SearchResponse>() {
            @Override
            public void onResponse(Call<SearchResponse> call, Response<SearchResponse> response) {
                if (response.isSuccessful() && response.body() != null) {
                    SearchResponse searchResponse = response.body();
                    
                    searchResults.clear();
                    
                    if (searchResponse.getMessages() != null) {
                        searchResults.addAll(searchResponse.getMessages());
                    }
                    
                    if (searchResponse.getChats() != null) {
                        searchResults.addAll(searchResponse.getChats());
                    }
                    
                    if (searchResponse.getUsers() != null) {
                        searchResults.addAll(searchResponse.getUsers());
                    }
                    
                    searchAdapter.notifyDataSetChanged();
                }
            }

            @Override
            public void onFailure(Call<SearchResponse> call, Throwable t) {
                Toast.makeText(SearchActivity.this, "Search failed", Toast.LENGTH_SHORT).show();
            }
        });
    }
}
