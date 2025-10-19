import React, { useEffect } from 'react'
import Layout from '../../components/Layout';
import AdminMenu from '../../components/AdminMenu';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/auth';
const Users = () => {
  const [auth] = useAuth();
  const [users, setUsers] = React.useState([]);
  
  const getAllUsers = async () => {
    try {
      const { data } = await axios.get("/api/v1/auth/all-users")

      if (data?.success) {
        setUsers(data?.data);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.message ?? "Something went wrong");
    }
  };

  useEffect(() => {
    getAllUsers();
  }, [auth]);

  return (
    <Layout title={"Dashboard - All Users"}>
        <div className="container-fluid m-3 p-3">
       <div className="row">
          <div className="col-md-3">
            <AdminMenu />
          </div>
          <div className="col-md-9">
            <h1>All Users</h1>
            <div className="table-responsive">
              <table className="table table-bordered">
                <thead>
                  <tr>
                    <th scope="col">#</th>
                    <th scope="col">Name</th>
                    <th scope="col">Email</th>
                    <th scope="col">Phone</th>
                    <th scope="col">Address</th>
                  </tr> 
                </thead>
                <tbody>
                  {users?.map((u, i) => (
                    <tr key={u._id}>
                      <th scope="row">{i + 1}</th>
                      <td>{u.name}</td>
                      <td>{u.email}</td>
                      <td>{u.phone}</td>
                      <td>{u.address}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        </div> 
    </Layout>
  );
};

export default Users;