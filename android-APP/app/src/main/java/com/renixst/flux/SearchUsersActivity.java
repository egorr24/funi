package com.renixst.flux;

import android.content.Intent;
import android.os.Bundle;
import android.widget.EditText;
import android.widget.ListView;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import com.renixst.flux.api.RetrofitClient;
import com.renixst.flux.models.User;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;
import java.util.ArrayList;
import java.util.List;

public class SearchUsersActivity extends AppCompatActivity {

    private EditText searchInput;
    private ListView resultsList;
    private List<User> foundUsers;
    private UsersAdapter usersAdapter;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_search_users);

        searchInput = findViewById(R.id.searchInput);
        resultsList = findViewById(R.id.resultsList);

        foundUsers = new ArrayList<>();
        usersAdapter = new UsersAdapter(this, foundUsers);
        resultsList.setAdapter(usersAdapter);

        searchInput.setOnEditorActionListener((v, actionId, event) -> {
            performSearch();
            return true;
        });

        resultsList.setOnItemClickListener((parent, view, position, id) -> {
            User selectedUser = foundUsers.get(position);
            // TODO: Create or open chat with user
            Toast.makeText(this, "Начать чат с " + selectedUser.name, Toast.LENGTH_SHORT).show();
            finish();
        });
    }

    private void performSearch() {
        String query = searchInput.getText().toString().trim();
        if (query.isEmpty()) {
            Toast.makeText(this, "Введите запрос", Toast.LENGTH_SHORT).show();
            return;
        }

        RetrofitClient.getApiService().searchUsers(query).enqueue(new Callback<List<User>>() {
            @Override
            public void onResponse(Call<List<User>> call, Response<List<User>> response) {
                if (response.isSuccessful() && response.body() != null) {
                    foundUsers.clear();
                    foundUsers.addAll(response.body());
                    usersAdapter.notifyDataSetChanged();
                } else {
                    Toast.makeText(SearchUsersActivity.this, "Пользователи не найдены", Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(Call<List<User>> call, Throwable t) {
                Toast.makeText(SearchUsersActivity.this, "Ошибка поиска", Toast.LENGTH_SHORT).show();
            }
        });
    }
}
