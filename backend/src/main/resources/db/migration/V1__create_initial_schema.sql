CREATE TABLE app_users (
    id BIGINT NOT NULL AUTO_INCREMENT,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(190) NOT NULL,
    password_hash VARCHAR(100) NOT NULL,
    created_at DATETIME NOT NULL,
    CONSTRAINT pk_app_users PRIMARY KEY (id),
    CONSTRAINT uk_app_users_email UNIQUE (email)
) ENGINE=InnoDB;

CREATE TABLE expenses (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    description VARCHAR(160) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    category VARCHAR(40) NOT NULL,
    expense_date DATE NOT NULL,
    notes VARCHAR(500) NULL,
    created_at DATETIME NOT NULL,
    CONSTRAINT pk_expenses PRIMARY KEY (id),
    CONSTRAINT fk_expenses_user FOREIGN KEY (user_id)
        REFERENCES app_users (id) ON DELETE CASCADE,
    INDEX idx_expense_user_date (user_id, expense_date),
    INDEX idx_expense_user_category (user_id, category)
) ENGINE=InnoDB;

CREATE TABLE monthly_budgets (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    budget_year INT NOT NULL,
    budget_month INT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    CONSTRAINT pk_monthly_budgets PRIMARY KEY (id),
    CONSTRAINT fk_budgets_user FOREIGN KEY (user_id)
        REFERENCES app_users (id) ON DELETE CASCADE,
    CONSTRAINT uk_budget_user_year_month
        UNIQUE (user_id, budget_year, budget_month)
) ENGINE=InnoDB;
