package com.store.attendance.seed;

import com.store.attendance.domain.Employee;
import com.store.attendance.domain.EmployeeRole;
import com.store.attendance.domain.Owner;
import com.store.attendance.domain.OwnerStore;
import com.store.attendance.domain.Store;
import com.store.attendance.repository.EmployeeRepository;
import com.store.attendance.repository.OwnerRepository;
import com.store.attendance.repository.OwnerStoreRepository;
import com.store.attendance.repository.StoreRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.env.Environment;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@Component
public class SeedDataRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(SeedDataRunner.class);

    private final OwnerRepository ownerRepository;
    private final StoreRepository storeRepository;
    private final OwnerStoreRepository ownerStoreRepository;
    private final EmployeeRepository employeeRepository;
    private final PasswordEncoder passwordEncoder;
    private final boolean enabled;

    public SeedDataRunner(
            OwnerRepository ownerRepository,
            StoreRepository storeRepository,
            OwnerStoreRepository ownerStoreRepository,
            EmployeeRepository employeeRepository,
            PasswordEncoder passwordEncoder,
            Environment env
    ) {
        this.ownerRepository = ownerRepository;
        this.storeRepository = storeRepository;
        this.ownerStoreRepository = ownerStoreRepository;
        this.employeeRepository = employeeRepository;
        this.passwordEncoder = passwordEncoder;
        this.enabled = env.getProperty("app.seed", Boolean.class, true);
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!enabled) {
            return;
        }
        ownerRepository.count()
                .flatMap(count -> count > 0 ? Mono.empty() : seed())
                .block();
    }

    private Mono<Void> seed() {
        String hash = passwordEncoder.encode("password");
        Owner owner = Owner.create("owner", hash, "Asha Patel");
        Store main = Store.create("MAIN", "Downtown Super Mart");
        Store east = Store.create("EAST", "Eastside Market");

        Employee mainMgr = Employee.create(main.getId(), "mgr.main", hash, "Ravi Kumar", EmployeeRole.MANAGER, null);
        Employee mainEmp1 = Employee.create(main.getId(), "emp1.main", hash, "Neha Sharma", EmployeeRole.EMPLOYEE, mainMgr.getId());
        Employee mainEmp2 = Employee.create(main.getId(), "emp2.main", hash, "Arjun Singh", EmployeeRole.EMPLOYEE, mainMgr.getId());

        Employee eastMgr = Employee.create(east.getId(), "mgr.east", hash, "Priya Nair", EmployeeRole.MANAGER, null);
        Employee eastEmp1 = Employee.create(east.getId(), "emp1.east", hash, "Vikram Rao", EmployeeRole.EMPLOYEE, eastMgr.getId());
        Employee eastEmp2 = Employee.create(east.getId(), "emp2.east", hash, "Meera Iyer", EmployeeRole.EMPLOYEE, eastMgr.getId());

        log.info("Seeding demo owner 'owner' / 'password' with stores MAIN and EAST");

        return ownerRepository.save(owner)
                .then(storeRepository.save(main))
                .then(storeRepository.save(east))
                .then(ownerStoreRepository.save(OwnerStore.link(owner.getId(), main.getId())))
                .then(ownerStoreRepository.save(OwnerStore.link(owner.getId(), east.getId())))
                .then(employeeRepository.save(mainMgr))
                .then(employeeRepository.save(mainEmp1))
                .then(employeeRepository.save(mainEmp2))
                .then(employeeRepository.save(eastMgr))
                .then(employeeRepository.save(eastEmp1))
                .then(employeeRepository.save(eastEmp2))
                .then();
    }
}
